resource "aws_secretsmanager_secret" "env_vars" {
  name = "${var.environment}/vaccichain/env"
}

resource "aws_secretsmanager_secret_version" "env_vars" {
  secret_id     = aws_secretsmanager_secret.env_vars.id
  secret_string = jsonencode(var.secrets)
}

variable "environment" {}
variable "secrets" {
  type = map(string)
}
