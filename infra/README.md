# VacciChain Infrastructure (Terraform)

Terraform modules for deploying VacciChain to AWS ECS Fargate.

## Structure

```
infra/
├── modules/
│   ├── vpc/      — VPC, subnets, NAT gateways
│   ├── ecs/      — ECS cluster, Fargate services, ALB, EFS
│   └── secrets/  — AWS Secrets Manager entries
└── envs/
    ├── staging/      — staging environment
    └── production/   — production environment
```

## Prerequisites

- [Terraform](https://developer.hashicorp.com/terraform/install) >= 1.6
- AWS credentials configured (`aws configure` or environment variables)
- An S3 bucket named `vaccichain-tfstate` for remote state (create once):
  ```bash
  aws s3api create-bucket --bucket vaccichain-tfstate --region us-east-1
  aws s3api put-bucket-versioning --bucket vaccichain-tfstate \
    --versioning-configuration Status=Enabled
  ```

## Deploy staging

```bash
cd infra/envs/staging
terraform init
terraform plan \
  -var="backend_image=<ECR_URI>/vaccichain-backend:latest" \
  -var="frontend_image=<ECR_URI>/vaccichain-frontend:latest" \
  -var="analytics_image=<ECR_URI>/vaccichain-analytics:latest"
terraform apply
```

## Deploy production

```bash
cd infra/envs/production
terraform init
terraform plan \
  -var="backend_image=<ECR_URI>/vaccichain-backend:<TAG>" \
  -var="frontend_image=<ECR_URI>/vaccichain-frontend:<TAG>" \
  -var="analytics_image=<ECR_URI>/vaccichain-analytics:<TAG>"
terraform apply
```

## Secrets

After `terraform apply`, populate secrets in AWS Secrets Manager:

```bash
for SECRET in JWT_SECRET ADMIN_SECRET_KEY SEP10_SERVER_KEY ISSUER_SECRET_KEY VACCINATIONS_CONTRACT_ID; do
  aws secretsmanager put-secret-value \
    --secret-id "vaccichain-staging/${SECRET}" \
    --secret-string "<value>"
done
```

## Tear down

```bash
terraform destroy
```
