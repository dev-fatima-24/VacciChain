variable "name"        { type = string }
variable "secret_names" {
  type    = list(string)
  default = [
    "JWT_SECRET",
    "ADMIN_SECRET_KEY",
    "SEP10_SERVER_KEY",
    "ISSUER_SECRET_KEY",
    "VACCINATIONS_CONTRACT_ID",
  ]
}

resource "aws_secretsmanager_secret" "this" {
  for_each                = toset(var.secret_names)
  name                    = "${var.name}/${each.key}"
  recovery_window_in_days = 7
  tags = { Name = "${var.name}-${each.key}" }
}

output "secret_arns" {
  value = { for k, v in aws_secretsmanager_secret.this : k => v.arn }
}
