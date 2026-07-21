# GitHub Actions authenticates to AWS via OIDC federation — no long-lived
# IAM access keys stored as GitHub secrets. Each workflow assumes a role
# scoped to exactly what it needs:
#   - deploy role: push to ECR, force a new ECS deployment. Runs on every
#     merge to main.
#   - terraform role: broader infra-provisioning permissions. Deliberately
#     NOT wired to auto-run on push — see infra/README.md for why.

variable "github_org" {
  type    = string
  default = "mkazre"
}

variable "github_repo" {
  type    = string
  default = "washrewards"
}

variable "github_environment" {
  description = "The GitHub Environment the deploy job targets. Must match exactly — when a workflow job specifies `environment:`, GitHub's OIDC token subject claim changes from the ref-based format (repo:OWNER/REPO:ref:refs/heads/BRANCH) to repo:OWNER/REPO:environment:NAME, regardless of what triggered the run (push or workflow_dispatch)."
  type        = string
  default     = "production"
}

variable "tags" {
  type    = map(string)
  default = {}
}

data "aws_caller_identity" "current" {}

# GitHub's OIDC provider — one per AWS account, reused by any repo/workflow
# that assumes a role trusting it. Thumbprint is GitHub's well-known root CA
# thumbprint (https://github.blog/changelog/2023-06-27-github-actions-update-on-oidc-integration-with-aws/).
resource "aws_iam_openid_connect_provider" "github" {
  url             = "https://token.actions.githubusercontent.com"
  client_id_list  = ["sts.amazonaws.com"]
  thumbprint_list = ["6938fd4d98bab03faadb97b34396831e3780aea1"]

  tags = var.tags
}

# --- Deploy role: build/push image, roll ECS service ---------------------

data "aws_iam_policy_document" "deploy_assume_role" {
  statement {
    actions = ["sts:AssumeRoleWithWebIdentity"]
    effect  = "Allow"

    principals {
      type        = "Federated"
      identifiers = [aws_iam_openid_connect_provider.github.arn]
    }

    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:aud"
      values   = ["sts.amazonaws.com"]
    }

    # Restricts to runs of this exact repo's deploy job targeting the
    # `production` GitHub Environment — a workflow run from a fork, another
    # repo, or a job that doesn't declare this environment cannot assume
    # this role. NOT ref:refs/heads/main — see github_environment above for
    # why that (more obvious-looking) condition is wrong here.
    condition {
      test     = "StringEquals"
      variable = "token.actions.githubusercontent.com:sub"
      values   = ["repo:${var.github_org}/${var.github_repo}:environment:${var.github_environment}"]
    }
  }
}

resource "aws_iam_role" "deploy" {
  name               = "washrewards-github-actions-deploy"
  assume_role_policy = data.aws_iam_policy_document.deploy_assume_role.json
  tags               = var.tags
}

data "aws_iam_policy_document" "deploy_permissions" {
  statement {
    sid    = "ECRAuth"
    effect = "Allow"
    actions = [
      "ecr:GetAuthorizationToken",
    ]
    resources = ["*"]
  }

  statement {
    sid    = "ECRPush"
    effect = "Allow"
    actions = [
      "ecr:BatchCheckLayerAvailability",
      "ecr:GetDownloadUrlForLayer",
      "ecr:BatchGetImage",
      "ecr:PutImage",
      "ecr:InitiateLayerUpload",
      "ecr:UploadLayerPart",
      "ecr:CompleteLayerUpload",
    ]
    resources = compact([var.ecr_repository_arn, var.website_ecr_repository_arn])
  }

  statement {
    sid    = "ECSDeploy"
    effect = "Allow"
    actions = [
      "ecs:DescribeServices",
      "ecs:DescribeTaskDefinition",
      "ecs:DescribeTasks",
      "ecs:RegisterTaskDefinition",
      "ecs:RunTask",
      "ecs:UpdateService",
    ]
    resources = ["*"]
  }

  # RegisterTaskDefinition needs to pass the task's execution/task roles to
  # ECS — without this the deploy fails with an iam:PassRole denial.
  statement {
    sid     = "PassTaskRoles"
    effect  = "Allow"
    actions = ["iam:PassRole"]
    resources = [
      var.ecs_task_execution_role_arn,
      var.ecs_task_role_arn,
    ]
  }
}

resource "aws_iam_role_policy" "deploy" {
  name   = "deploy-permissions"
  role   = aws_iam_role.deploy.id
  policy = data.aws_iam_policy_document.deploy_permissions.json
}

variable "ecr_repository_arn" {
  type = string
}

variable "website_ecr_repository_arn" {
  type    = string
  default = null
}

variable "ecs_task_execution_role_arn" {
  type = string
}

variable "ecs_task_role_arn" {
  type = string
}

output "deploy_role_arn" {
  value = aws_iam_role.deploy.arn
}

output "github_oidc_provider_arn" {
  value = aws_iam_openid_connect_provider.github.arn
}
