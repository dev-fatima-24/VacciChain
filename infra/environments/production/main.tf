provider "aws" {
  region = "us-east-1"
}

module "vpc" {
  source      = "../../modules/vpc"
  environment = "production"
  vpc_cidr    = "10.1.0.0/16"
}

module "ecs" {
  source        = "../../modules/ecs"
  environment   = "production"
  backend_image = "vaccichain-backend:latest"
  python_image  = "vaccichain-python:latest"
}

module "secrets" {
  source      = "../../modules/secrets"
  environment = "production"
  secrets = {
    STELLAR_NETWORK = "mainnet"
    JWT_SECRET      = "prod-secret-very-secure"
  }
}
