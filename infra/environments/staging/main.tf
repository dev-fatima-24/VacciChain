provider "aws" {
  region = "us-east-1"
}

module "vpc" {
  source      = "../../modules/vpc"
  environment = "staging"
}

module "ecs" {
  source        = "../../modules/ecs"
  environment   = "staging"
  backend_image = "vaccichain-backend:staging"
  python_image  = "vaccichain-python:staging"
}

module "secrets" {
  source      = "../../modules/secrets"
  environment = "staging"
  secrets = {
    STELLAR_NETWORK = "testnet"
    JWT_SECRET      = "staging-secret"
  }
}
