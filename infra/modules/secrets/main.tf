variable "name_prefix" {
  type    = string
  default = "washrewards"
}

variable "secret_values" {
  description = "Full set of Laravel .env-equivalent key/value pairs for the app secret"
  type        = map(string)
  sensitive   = true
}

variable "tags" {
  type    = map(string)
  default = {}
}

resource "aws_secretsmanager_secret" "app" {
  name        = "${var.name_prefix}/app-env"
  description = "Laravel application secrets (DB, Redis, mail, gateway) — one JSON blob, referenced key-by-key from the ECS task definitions"
  tags        = var.tags
}

resource "aws_secretsmanager_secret_version" "app" {
  secret_id     = aws_secretsmanager_secret.app.id
  secret_string = jsonencode(var.secret_values)

  # Terraform sets the *initial* value only. After that, secrets are
  # rotated/updated out-of-band (AWS console, `aws secretsmanager
  # put-secret-value`, or a rotation Lambda) — not by re-running `terraform
  # apply`, which would mean actual credentials sitting in a .tf variable
  # or, worse, committed state. See infra/README.md for which keys need a
  # manual value filled in after the first apply (namely DB_PASSWORD, since
  # Terraform can't read the password of a pre-existing RDS instance).
  lifecycle {
    ignore_changes = [secret_string]
  }
}

output "secret_arn" {
  value = aws_secretsmanager_secret.app.arn
}

output "secret_name" {
  value = aws_secretsmanager_secret.app.name
}
