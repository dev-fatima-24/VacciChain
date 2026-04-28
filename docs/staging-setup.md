# Setting Up Staging Environment on AWS

This guide walks through setting up the staging environment on AWS ECS.

## Prerequisites

- AWS Account with appropriate permissions
- AWS CLI configured
- Docker installed locally
- GitHub repository with deploy-staging.yml workflow

## Step 1: Create IAM Roles

### ECS Task Execution Role

```bash
# Create trust policy
cat > trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ecs-tasks.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name ecsTaskExecutionRole \
  --assume-role-policy-document file://trust-policy.json

# Attach policy
aws iam attach-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Add Secrets Manager permissions
aws iam put-role-policy \
  --role-name ecsTaskExecutionRole \
  --policy-name SecretsManagerAccess \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "secretsmanager:GetSecretValue",
          "secretsmanager:DescribeSecret"
        ],
        "Resource": "arn:aws:secretsmanager:*:*:secret:vaccichain/staging/*"
      }
    ]
  }'
```

### ECS Task Role

```bash
# Create task role
aws iam create-role \
  --role-name vaccichain-staging-task-role \
  --assume-role-policy-document file://trust-policy.json

# Add permissions for backend to access Secrets Manager
aws iam put-role-policy \
  --role-name vaccichain-staging-task-role \
  --policy-name BackendPermissions \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "secretsmanager:GetSecretValue"
        ],
        "Resource": "arn:aws:secretsmanager:*:*:secret:vaccichain/staging/*"
      }
    ]
  }'
```

## Step 2: Create ECR Repositories

```bash
# Create repositories
aws ecr create-repository --repository-name vaccichain-backend
aws ecr create-repository --repository-name vaccichain-frontend
aws ecr create-repository --repository-name vaccichain-python

# Enable image scanning
for repo in vaccichain-backend vaccichain-frontend vaccichain-python; do
  aws ecr put-image-scanning-configuration \
    --repository-name $repo \
    --image-scanning-configuration scanOnPush=true
done
```

## Step 3: Create Secrets in Secrets Manager

```bash
# Create staging secrets
aws secretsmanager create-secret \
  --name vaccichain/staging/stellar \
  --secret-string '{
    "VACCINATIONS_CONTRACT_ID": "C...",
    "ADMIN_SECRET_KEY": "S...",
    "ADMIN_PUBLIC_KEY": "G...",
    "SEP10_SERVER_KEY": "S...",
    "ISSUER_SECRET_KEY": "S...",
    "JWT_SECRET": "your-jwt-secret-min-32-chars"
  }'
```

## Step 4: Create ECS Cluster

```bash
# Create cluster
aws ecs create-cluster --cluster-name vaccichain-staging

# Create CloudWatch log group
aws logs create-log-group --log-group-name /ecs/vaccichain-staging
```

## Step 5: Register Task Definition

```bash
# Update task definition template with your AWS account ID and region
sed -i 's/ACCOUNT_ID/123456789012/g' staging/task-definition-backend.json
sed -i 's/REGION/us-east-1/g' staging/task-definition-backend.json

# Register task definition
aws ecs register-task-definition \
  --cli-input-json file://staging/task-definition-backend.json
```

## Step 6: Create ECS Service

```bash
# Create service
aws ecs create-service \
  --cluster vaccichain-staging \
  --service-name vaccichain-staging \
  --task-definition vaccichain-staging:1 \
  --desired-count 1 \
  --launch-type FARGATE \
  --network-configuration "awsvpcConfiguration={subnets=[subnet-xxx],securityGroups=[sg-xxx],assignPublicIp=ENABLED}" \
  --load-balancers targetGroupArn=arn:aws:elasticloadbalancing:...,containerName=frontend,containerPort=80
```

## Step 7: Configure GitHub Secrets

Add these secrets to your GitHub repository:

```bash
# AWS role for GitHub Actions
AWS_ROLE_TO_ASSUME_STAGING=arn:aws:iam::123456789012:role/GitHubActionsRole

# AWS region
AWS_REGION=us-east-1
```

## Step 8: Create GitHub Actions Role

```bash
# Create trust policy for GitHub
cat > github-trust-policy.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Federated": "arn:aws:iam::123456789012:oidc-provider/token.actions.githubusercontent.com"
      },
      "Action": "sts:AssumeRoleWithWebIdentity",
      "Condition": {
        "StringEquals": {
          "token.actions.githubusercontent.com:aud": "sts.amazonaws.com"
        },
        "StringLike": {
          "token.actions.githubusercontent.com:sub": "repo:your-org/VacciChain:*"
        }
      }
    }
  ]
}
EOF

# Create role
aws iam create-role \
  --role-name GitHubActionsRole \
  --assume-role-policy-document file://github-trust-policy.json

# Add permissions
aws iam put-role-policy \
  --role-name GitHubActionsRole \
  --policy-name ECSDeployment \
  --policy-document '{
    "Version": "2012-10-17",
    "Statement": [
      {
        "Effect": "Allow",
        "Action": [
          "ecr:GetAuthorizationToken",
          "ecr:BatchGetImage",
          "ecr:GetDownloadUrlForLayer",
          "ecr:PutImage",
          "ecr:InitiateLayerUpload",
          "ecr:UploadLayerPart",
          "ecr:CompleteLayerUpload"
        ],
        "Resource": "*"
      },
      {
        "Effect": "Allow",
        "Action": [
          "ecs:UpdateService",
          "ecs:DescribeServices",
          "ecs:DescribeTaskDefinition",
          "ecs:DescribeTasks",
          "ecs:ListTasks",
          "ecs:RegisterTaskDefinition"
        ],
        "Resource": "*"
      }
    ]
  }'
```

## Step 9: Set Up Load Balancer (Optional)

```bash
# Create Application Load Balancer
aws elbv2 create-load-balancer \
  --name vaccichain-staging-alb \
  --subnets subnet-xxx subnet-yyy \
  --security-groups sg-xxx

# Create target group
aws elbv2 create-target-group \
  --name vaccichain-staging-tg \
  --protocol HTTP \
  --port 80 \
  --vpc-id vpc-xxx \
  --target-type ip

# Create listener
aws elbv2 create-listener \
  --load-balancer-arn arn:aws:elasticloadbalancing:... \
  --protocol HTTP \
  --port 80 \
  --default-actions Type=forward,TargetGroupArn=arn:aws:elasticloadbalancing:...
```

## Step 10: Test Deployment

```bash
# Trigger deployment
gh workflow run deploy-staging.yml

# Monitor deployment
gh run list --workflow=deploy-staging.yml

# Check service status
aws ecs describe-services \
  --cluster vaccichain-staging \
  --services vaccichain-staging
```

## Verification

```bash
# Get service URL
aws elbv2 describe-load-balancers \
  --names vaccichain-staging-alb \
  --query 'LoadBalancers[0].DNSName'

# Test health endpoint
curl http://<ALB-DNS>/health

# View logs
aws logs tail /ecs/vaccichain-staging --follow
```

## Cleanup

To remove staging environment:

```bash
# Delete service
aws ecs delete-service \
  --cluster vaccichain-staging \
  --service vaccichain-staging \
  --force

# Delete cluster
aws ecs delete-cluster --cluster vaccichain-staging

# Delete ECR repositories
for repo in vaccichain-backend vaccichain-frontend vaccichain-python; do
  aws ecr delete-repository --repository-name $repo --force
done

# Delete secrets
aws secretsmanager delete-secret \
  --secret-id vaccichain/staging/stellar \
  --force-delete-without-recovery

# Delete IAM roles
aws iam delete-role-policy --role-name ecsTaskExecutionRole --policy-name SecretsManagerAccess
aws iam detach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy
aws iam delete-role --role-name ecsTaskExecutionRole
aws iam delete-role-policy --role-name vaccichain-staging-task-role --policy-name BackendPermissions
aws iam delete-role --role-name vaccichain-staging-task-role
```

## References

- [AWS ECS Getting Started](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/getting-started.html)
- [GitHub Actions OIDC](https://docs.github.com/en/actions/deployment/security-hardening-your-deployments/about-security-hardening-with-openid-connect)
