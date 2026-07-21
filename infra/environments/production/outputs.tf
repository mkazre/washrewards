output "api_url" {
  value = var.domain_name != null ? module.dns[0].api_url : "http://${module.alb.alb_dns_name}"
}

output "route53_name_servers" {
  description = "Point your domain registrar at these (only set if domain_name was provided)"
  value       = var.domain_name != null ? module.dns[0].name_servers : null
}

output "ecr_repository_url" {
  value = module.ecr.repository_url
}

output "ecs_cluster_name" {
  value = module.ecs.cluster_name
}

output "github_actions_deploy_role_arn" {
  description = "Put this in the deploy workflow's `role-to-assume` — not a secret, it's just an ARN"
  value       = module.cicd.deploy_role_arn
}

output "app_secrets_arn" {
  value = module.secrets.secret_arn
}

output "cloudfront_media_domain" {
  value = module.storage.cloudfront_domain_name
}
