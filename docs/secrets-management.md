# Secrets Management for Production

This document outlines how VacciChain manages secrets in production environments.

## Overview

Secrets (Stellar keys, JWT secret, API credentials) must never be stored in flat files, environment variables visible in `docker inspect`, or baked into container images. VacciChain supports multiple secrets management backends.

## Supported Backends

### AWS Secrets Manager (Recommended)

**Setup:**

1. Create secrets in AWS Secrets Manager:
   ```bash
   aws secretsmanager create-secret \
     --name vaccichain/prod/stellar \
     --secret-string '{
       "STELLAR_NETWORK": "mainnet",
       "HORIZON_URL": "https://horizon.stellar.org",
       "SOROBAN_RPC_URL": "https://soroban-rpc.stellar.org",
       "STELLAR_NETWORK_PASSPHRASE": "Public Global Stellar Network ; September 2015",
       "VACCINATIONS_CONTRACT_ID": "C...",
       "ADMIN_SECRET_KEY": "S...",
       "ADMIN_PUBLIC_KEY": "G...",
       "SEP10_SERVER_KEY": "S...",
       "ISSUER_SECRET_KEY": "S...",
       "JWT_SECRET": "..."
     }'
   ```

2. Grant IAM permissions to ECS task role:
   ```json
   {
     "Version": "2012-10-17",
     "Statement": [
       {
         "Effect": "Allow",
         "Action": [
           "secretsmanager:GetSecretValue",
           "secretsmanager:DescribeSecret"
         ],
         "Resource": "arn:aws:secretsmanager:*:*:secret:vaccichain/*"
       }
     ]
   }
   ```

3. Update ECS task definition to use `secretsManagerSecrets`:
   ```json
   {
     "name": "backend",
     "secrets": [
       {
         "name": "STELLAR_NETWORK",
         "valueFrom": "arn:aws:secretsmanager:region:account:secret:vaccichain/prod/stellar:STELLAR_NETWORK::"
       }
     ]
   }
   ```

### HashiCorp Vault

**Setup:**

1. Store secrets in Vault:
   ```bash
   vault kv put secret/vaccichain/prod \
     STELLAR_NETWORK=mainnet \
     HORIZON_URL=https://horizon.stellar.org \
     ...
   ```

2. Configure Vault agent in container:
   ```hcl
   vault {
     address = "https://vault.example.com:8200"
     retry {
       num_retries = 5
     }
   }

   auto_auth {
     method {
       type = "kubernetes"
       config = {
         role = "vaccichain"
       }
     }
   }

   template {
     source = "/etc/vault/templates/.env.tpl"
     destination = "/app/.env"
     command = "kill -HUP $MAINPID"
   }
   ```

### Environment Variables (Development Only)

For local development, use `.env` files (never commit to git):

```bash
cp .env.example .env
# Edit .env with local values
```

## Secret Rotation

### AWS Secrets Manager

1. Update secret value:
   ```bash
   aws secretsmanager update-secret \
     --secret-id vaccichain/prod/stellar \
     --secret-string '{...new values...}'
   ```

2. Restart containers to pick up new values:
   ```bash
   # ECS
   aws ecs update-service \
     --cluster vaccichain-prod \
     --service backend \
     --force-new-deployment

   # Docker Compose
   docker-compose up -d --force-recreate
   ```

### Vault

1. Update secret:
   ```bash
   vault kv put secret/vaccichain/prod KEY=new_value
   ```

2. Vault agent automatically reloads and restarts the application via the `command` hook.

## Security Best Practices

- **Never log secrets**: Ensure logging middleware redacts sensitive values
- **Minimal permissions**: Grant IAM/Vault roles only necessary permissions
- **Audit trails**: Enable CloudTrail (AWS) or audit logging (Vault)
- **Encryption in transit**: Use TLS for all secret retrieval
- **Encryption at rest**: Enable encryption for Secrets Manager and Vault storage
- **Access control**: Restrict who can view/modify secrets
- **Rotation schedule**: Rotate JWT_SECRET and keys quarterly

## Verification

To verify secrets are not exposed:

```bash
# Check no secrets in docker inspect
docker inspect vaccichain-backend | grep -i secret

# Check no secrets in environment
docker exec vaccichain-backend env | grep -E 'SECRET|KEY'

# Check no secrets in logs
docker logs vaccichain-backend | grep -E 'SECRET|KEY'
```

All should return empty results.

## Troubleshooting

**Secrets not loading:**
- Verify IAM/Vault permissions
- Check secret name and path match configuration
- Review container logs for auth errors

**Stale secrets after rotation:**
- Force container restart
- Verify new secret value in Secrets Manager/Vault
- Check container startup logs

## References

- [AWS Secrets Manager](https://docs.aws.amazon.com/secretsmanager/)
- [HashiCorp Vault](https://www.vaultproject.io/docs)
- [ECS Secrets Integration](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/specifying-sensitive-data.html)
