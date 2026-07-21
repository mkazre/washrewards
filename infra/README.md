# WashRewards SA — Infrastructure

Terraform for the production AWS environment: ECS Fargate running the
Laravel API/admin + queue worker + scheduled task, an ALB with WAF, the
existing RDS/VPC (reused, not recreated), a new ElastiCache Redis, S3 +
CloudFront for media, Secrets Manager, Route 53 + ACM, and a GitHub Actions
OIDC role for deploys.

**Nothing here has been applied yet.** This is all written and validated
(`terraform validate` passes for every module) but not run against real AWS
— that's a deliberate choice: provisioning real, billable infrastructure and
creating IAM roles is exactly the kind of action that should wait for your
explicit go-ahead, run with credentials you control.

## What you'll need

An AWS identity with broad permissions for the *one-time* bootstrap +
initial apply (VPC/EC2 read, ECS, ECR, IAM role/policy create, RDS read,
ElastiCache, S3, CloudFront, Route 53, ACM, Secrets Manager, WAFv2,
EventBridge Scheduler, CloudWatch Logs, STS). For a project this size,
running the one-time `terraform apply` with your own `AdministratorAccess`
credentials (never stored — just used from your shell) is the pragmatic
choice; a tightly-scoped custom policy can replace it later if you want.
**This is separate from, and not the same as, the deploy role Terraform
creates** — that one (see below) is what GitHub Actions actually uses
day-to-day, and it's deliberately narrow (ECR push + ECS deploy only).

## 1. Bootstrap the state bucket (once)

```bash
cd infra/bootstrap
terraform init
terraform apply -var="state_bucket_name=washrewards-terraform-state"
```

If you'd rather use a different bucket name (must be globally unique),
change it here and in `environments/production/versions.tf`'s backend block.

## 2. Fill in the real values

```bash
cd infra/environments/production
cp terraform.tfvars.example terraform.tfvars
```

`existing_vpc_id` and `existing_db_instance_identifier` are already filled
in from the AWS inventory. You still need `public_subnet_ids` and
`private_subnet_ids` — which of the existing VPC's subnets are public
(route to an Internet Gateway) vs private (route to a NAT Gateway, or no
outbound route at all). If you're not sure, run:

```bash
aws ec2 describe-subnets --filters "Name=vpc-id,Values=vpc-00c4e8dd33a1e4c9c" --region af-south-1 \
  --query 'Subnets[].{Id:SubnetId,AZ:AvailabilityZone,CIDR:CidrBlock}' --output table
aws ec2 describe-route-tables --filters "Name=vpc-id,Values=vpc-00c4e8dd33a1e4c9c" --region af-south-1 \
  --query 'RouteTables[].{Routes:Routes[].{Dest:DestinationCidrBlock,Gw:GatewayId},Assoc:Associations[].SubnetId}'
```

A subnet whose route table has a route to an `igw-*` is public; one routing
through a `nat-*` (or with no default route at all) is private. You need at
least 2 of each, in different Availability Zones.

`domain_name` is already set to `washrewards.online`.

## 3. Plan and apply

```bash
terraform init
terraform plan   # review before applying anything real
terraform apply
```

## 4. Manual steps after the first apply

Terraform can't do these — they involve either a secret it has no way to
read, or a one-time external action:

1. **Set the real DB password.** Terraform wrote a placeholder
   (`REPLACE_ME_MANUALLY`) into the app secret, since it can't read the
   existing RDS instance's actual master password.
   ```bash
   aws secretsmanager get-secret-value --secret-id washrewards/app-env --query SecretString --output text > /tmp/secret.json
   jq '.DB_PASSWORD = "the-actual-rds-password"' /tmp/secret.json > /tmp/secret-updated.json
   aws secretsmanager put-secret-value --secret-id washrewards/app-env --secret-string file:///tmp/secret-updated.json
   rm /tmp/secret.json /tmp/secret-updated.json
   ```
2. **Set `APP_KEY`.** Generate one and put it in the same secret:
   ```bash
   php artisan key:generate --show   # run from backend/, prints base64:...
   # then patch it into the secret the same way as DB_PASSWORD above
   ```
3. **Point your domain's nameservers** at the output `route53_name_servers`
   (wherever `washrewards.online` is registered).
4. **Confirm the RDS database exists.** The app secret assumes a database
   named `washrewards` on the existing instance — create it if it isn't
   already there (`CREATE DATABASE washrewards;`).
5. **Set the GitHub repo variables** (Settings → Secrets and variables →
   Actions → Variables — these are Terraform *outputs*, not secrets, safe to
   be visible in the repo):
   - `AWS_DEPLOY_ROLE_ARN` → `terraform output github_actions_deploy_role_arn`
   - `AWS_REGION` → `af-south-1`
   - `ECR_REPOSITORY` → `washrewards-app`
   - `ECS_CLUSTER` → `terraform output ecs_cluster_name`
6. **Create a `production` GitHub Environment** (Settings → Environments) —
   `deploy.yml` targets it. Add required reviewers if you want deploys
   gated behind manual approval.
7. Once secrets are set, force the first real deploy: push to `main` (any
   change under `backend/`) or run the `Deploy backend` workflow manually.

## Why GitHub Actions has no stored AWS keys

The deploy workflow authenticates via OIDC federation
(`infra/modules/cicd`) — GitHub issues a short-lived signed token, AWS
verifies it and hands out temporary credentials scoped to exactly the
`washrewards-github-actions-deploy` role, which can only push to this one
ECR repo and update these two ECS services (see
`infra/modules/cicd/main.tf`). Nothing long-lived sits in GitHub secrets.
`terraform apply` itself is deliberately **not** wired into CI yet — see the
comment at the top of this file.

## Module layout

| Module | What it manages |
|---|---|
| `modules/ecr` | Docker image registry, immutable tags |
| `modules/alb` | Load balancer, target group, WAF (managed rule groups + rate limiting) |
| `modules/ecs` | Cluster, API/queue/scheduler task defs + services, autoscaling, IAM |
| `modules/redis` | ElastiCache replication group (encrypted, AUTH token) |
| `modules/storage` | S3 media bucket + CloudFront (private bucket, OAC) |
| `modules/secrets` | Secrets Manager entry for the app's env vars |
| `modules/dns` | Route 53 zone, ACM cert (DNS-validated), API DNS record |
| `modules/cicd` | GitHub OIDC provider + narrowly-scoped deploy role |

`environments/production/main.tf` wires these together and adds the two
things that only make sense at the environment level: the `data` lookups for
the existing VPC/RDS, and the security group rule granting ECS access into
the existing RDS security group.

## What's not here yet

- A real payment gateway (still `sandbox` — see `backend/config/payments.php`)
- The public static-site hosting (deferred per your call — add an S3+CloudFront
  module for it when you're ready to wire it to the API)
- A staging environment (production-only for now, per your call)
