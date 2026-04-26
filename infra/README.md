# Infrastructure as Code (IaC)

This directory contains the Terraform modules and environment configurations for deploying VacciChain to AWS.

## Directory Structure

- `modules/`: Reusable Terraform modules (VPC, ECS, Secrets).
- `environments/`: Environment-specific configurations (Staging, Production).

## Prerequisites

- [Terraform](https://www.terraform.io/downloads.html) installed.
- AWS CLI configured with appropriate credentials.

## Deployment Instructions

### 1. Choose an environment
Navigate to the desired environment directory:

```bash
cd infra/environments/staging
# OR
cd infra/environments/production
```

### 2. Initialize Terraform
```bash
terraform init
```

### 3. Plan the deployment
```bash
terraform plan
```

### 4. Apply the changes
```bash
terraform apply
```

## Cleanup

To destroy the infrastructure:
```bash
terraform destroy
```
