# Staging Environment

VacciChain maintains a production-equivalent staging environment for testing before production deployment.

## Overview

- **Network:** Stellar Testnet (matches production configuration, uses testnet)
- **Deployment:** Automatic on merge to `main`
- **URL:** https://staging.vaccichain.example.com
- **Infrastructure:** AWS ECS Fargate (same as production)
- **Secrets:** AWS Secrets Manager (same as production)

## Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Staging Environment                  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  │
│  │   Frontend   │  │   Backend    │  │   Python     │  │
│  │   (nginx)    │  │  (Express)   │  │  (FastAPI)   │  │
│  │   Port 80    │  │  Port 4000   │  │  Port 8001   │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  │
│         │                  │                  │         │
│         └──────────────────┼──────────────────┘         │
│                            │                            │
│                    ┌───────▼────────┐                   │
│                    │ AWS Secrets    │                   │
│                    │ Manager        │                   │
│                    └────────────────┘                   │
│                                                         │
│                    ┌───────────────┐                    │
│                    │ Stellar       │                    │
│                    │ Testnet       │                    │
│                    └───────────────┘                    │
│                                                         │
└─────────────────────────────────────────────────────────┘
```

## Deployment Process

### Automatic Deployment

1. Code is pushed to `main` branch
2. CI tests run (contract, backend, python, docker)
3. On success, `deploy-staging.yml` workflow triggers
4. Docker images are built and pushed to ECR
5. ECS task definition is updated
6. New containers are deployed to staging cluster
7. Smoke tests verify deployment
8. Deployment summary posted to GitHub

### Manual Deployment

```bash
# Trigger deployment manually
gh workflow run deploy-staging.yml
```

## Testing in Staging

### Access Staging Environment

```bash
# Frontend
https://staging.vaccichain.example.com

# Backend API
https://staging.vaccichain.example.com/api

# Health check
curl https://staging.vaccichain.example.com/health
```

### Test Vaccination Flow

1. Connect Freighter wallet (set to Testnet)
2. Request SEP-10 challenge: `POST /auth/sep10`
3. Sign challenge with wallet
4. Verify signature: `POST /auth/verify`
5. Receive JWT token
6. Issue vaccination: `POST /vaccination/issue`
7. Verify vaccination: `GET /verify/{wallet}`

### Run Integration Tests

```bash
# From project root
npm run test:staging

# Or manually
curl -X POST https://staging.vaccichain.example.com/auth/sep10 \
  -H "Content-Type: application/json" \
  -d '{"account": "GAAAA..."}'
```

## Monitoring Staging

### CloudWatch Logs

```bash
# View backend logs
aws logs tail /ecs/vaccichain-staging --follow --filter-pattern "backend"

# View frontend logs
aws logs tail /ecs/vaccichain-staging --follow --filter-pattern "frontend"

# View python-service logs
aws logs tail /ecs/vaccichain-staging --follow --filter-pattern "python-service"
```

### ECS Metrics

```bash
# Check service status
aws ecs describe-services \
  --cluster vaccichain-staging \
  --services vaccichain-staging

# View task status
aws ecs list-tasks --cluster vaccichain-staging
aws ecs describe-tasks --cluster vaccichain-staging --tasks <task-arn>
```

## Secrets Management in Staging

Staging uses the same AWS Secrets Manager setup as production:

```bash
# View staging secrets
aws secretsmanager describe-secret \
  --secret-id vaccichain/staging/stellar

# Update staging secrets
aws secretsmanager update-secret \
  --secret-id vaccichain/staging/stellar \
  --secret-string '{...}'
```

## Troubleshooting

### Deployment Failed

1. Check GitHub Actions workflow logs
2. Review ECS task logs: `aws logs tail /ecs/vaccichain-staging`
3. Verify secrets exist in Secrets Manager
4. Check IAM permissions for ECS task role

### Service Not Responding

```bash
# Check service health
curl https://staging.vaccichain.example.com/health

# Check ECS task status
aws ecs describe-tasks \
  --cluster vaccichain-staging \
  --tasks $(aws ecs list-tasks --cluster vaccichain-staging --query 'taskArns[0]' --output text)

# View recent logs
aws logs tail /ecs/vaccichain-staging --follow --since 10m
```

### Secrets Not Loading

1. Verify secret exists: `aws secretsmanager get-secret-value --secret-id vaccichain/staging/stellar`
2. Check task role has permissions
3. Review backend logs for auth errors
4. Restart service: `aws ecs update-service --cluster vaccichain-staging --service vaccichain-staging --force-new-deployment`

## Promoting to Production

When staging is verified and ready:

1. Create a release tag: `git tag v1.0.0`
2. Push tag: `git push origin v1.0.0`
3. Trigger production deployment: `gh workflow run deploy.yml -f network=mainnet`
4. Monitor production deployment

## Cost Optimization

Staging runs on:
- **ECS Fargate**: t3.small (0.25 vCPU, 512 MB) - ~$15/month
- **ECR**: ~$0.10/GB storage
- **Secrets Manager**: ~$0.40/secret/month
- **CloudWatch Logs**: ~$0.50/GB ingested

Total estimated cost: ~$20-30/month

To reduce costs:
- Scale down during off-hours
- Use spot instances for non-critical workloads
- Archive old logs to S3

## References

- [AWS ECS Documentation](https://docs.aws.amazon.com/ecs/)
- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [GitHub Actions Workflows](https://docs.github.com/en/actions/using-workflows)
