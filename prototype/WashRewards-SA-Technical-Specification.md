# WashRewards SA — Technical Specification & AWS Hosting Requirements

**Document version:** 1.0
**Date:** 10 July 2026
**Prepared for:** App Owner & AWS Cloud Engineer
**Product:** WashRewards SA — Car-wash booking & loyalty platform (South Africa)

---

## 1. Purpose of this document

This document defines the technical architecture, technology stack, and cloud
hosting requirements for taking the **WashRewards SA** prototype to a
production-grade mobile application.

It has two audiences:

1. **The app owner** — to understand what is being built, the technology
   choices, and the moving parts that make up the product.
2. **The AWS Cloud Engineer** — to understand exactly which AWS resources need
   to be provisioned. **Section 7 (AWS Resource Requirements)** is the
   actionable checklist for provisioning.

---

## 2. Product overview & business model

WashRewards SA is a **two-sided marketplace** connecting car owners with car-wash
partners, with a built-in loyalty/rewards programme. Each car-wash business is a
**tenant** on the platform, and tenants come in two types — **fixed garages** and
**mobile car washes** (see §2.4). Payments are collected by the platform and
settled to tenants (see §2.5).

### 2.1 Consumer app (car owners)
- Sign-up / login and profile management
- Register and manage vehicles
- Discover nearby car washes (**list view + map view with geolocation**)
- View partner details, packages, pricing, availability and verified reviews
- Book a wash (select partner → package → time slot)
- **In-app payment** (card & instant EFT)
- Digital receipts and transaction history
- **Loyalty programme** — earn a R100 voucher every 5 paid washes
- Voucher wallet & redemption
- Rate & review completed washes (verified reviews only)
- Push notifications (booking confirmations, voucher progress, offers)

### 2.2 Partner app / portal (car-wash businesses)
- Business dashboard (revenue settled, bookings, customers, ratings)
- Manage today's bookings (check-in → mark done workflow)
- Manage services & pricing
- Create promotions
- QR-code driven customer sign-ups
- View reviews and analytics

### 2.3 Admin dashboard (platform operator — internal)
- Manage users, partners and vehicles
- **Tenant onboarding & approval** — vet and activate new businesses, set their
  type (fixed garage / mobile wash)
- **Commission configuration** — set platform commission rate per tenant or globally
- Oversee bookings, payments, **settlements and per-tenant payouts** and disputes
- Configure the loyalty programme and vouchers
- Content moderation (reviews)
- Reporting & platform analytics

### 2.4 Multi-tenancy & business models

Every car-wash business is a **tenant**. The platform uses **shared-database,
row-level multi-tenancy**: a single database where every tenant-owned record
carries a `tenant_id`, automatically scoped by a **Laravel global scope** and a
tenant-resolution middleware. This is the right model for a discovery
marketplace — **consumers query across all tenants** to find nearby washes, while
each business, when logged in, sees **only its own** bookings, services, reviews
and payouts. (Database-per-tenant isolation was considered and rejected as
unnecessary overhead for this use case.)

**Access model:** a `User` can be a consumer, and/or belong to a tenant with a
partner role (owner / staff). This is enforced with Laravel Sanctum tokens plus
policy/gate authorization — the same person can shop as a consumer and manage
their business from the one React Native app (role-based).

Tenants come in **two types**, distinguished by a `type` field, with different
behaviour, data and booking flows:

| Aspect | **Fixed garage** (`fixed_garage`) | **Mobile car wash** (`mobile_wash`) |
|---|---|---|
| Location | Fixed storefront (lat/long) | Service **area + travel radius**, no fixed address |
| Booking flow | Customer travels to the garage; time-slot at the venue | Washer travels to the **customer-supplied address**; slot + travel window |
| Pricing | Package price | Package price **+ optional travel / call-out fee** |
| Map discovery | Pinned at the storefront | Shown only when the customer is **within the service radius** |
| Extra data model | `address`, `geo_point` | `service_areas`, `travel_radius_km`, `travel_fee`; per-booking `service_address` |

Both types share the same core entities (`services`/packages, `bookings`,
`reviews`, `promotions`, `payouts`) — the `type` field drives the differences in
the booking UI, pricing calculation, and geolocation/discovery logic.

### 2.5 Payments & marketplace settlement

The platform operates a **collect-and-settle** model:

1. The customer pays in-app through a **South African payment gateway**
   (PayFast / Peach Payments / Paystack / Yoco / Ozow instant-EFT). Funds are
   collected into the **platform** merchant account.
2. Each successful booking is recorded in a **ledger** and split into:
   **partner earnings**, **platform commission**, and a **voucher contribution**
   (the pool that funds R100 loyalty vouchers). New tables: `transactions`,
   `settlements` / `payouts`.
3. **Laravel Queue jobs + Scheduler** compute settlements and trigger
   **scheduled per-tenant payouts** to each garage / mobile washer. Mobile-wash
   payouts include any travel fee collected.
4. **PCI-DSS** stays entirely with the gateway (SAQ-A scope). The app and AWS
   store only transaction **references** and metadata — never raw card data.

---

## 3. Technology stack

| Layer | Technology | Notes |
|---|---|---|
| **Mobile app** | **React Native** (recommend Expo + EAS build) | Single codebase for iOS & Android |
| **Backend API** | **Laravel (PHP 8.3+)** | RESTful JSON API for the mobile apps |
| **Admin dashboard** | **Laravel** (Blade + Livewire, or Filament) | Server-rendered web admin, same codebase/DB as API |
| **API authentication** | **Laravel Sanctum** (token-based) | Alternative: Amazon Cognito if federated identity is required |
| **Multi-tenancy** | **Shared-DB, row-level** (`tenant_id` scoping via Laravel global scopes) | Each car-wash business is a tenant. `stancl/tenancy` DB-per-tenant considered and rejected as overkill for a discovery marketplace |
| **Database** | **MySQL 8** (Amazon RDS) | PostgreSQL is an acceptable alternative |
| **Cache / sessions / queues** | **Redis** (Amazon ElastiCache) | Laravel cache, session store, and queue backend |
| **Background jobs** | **Laravel Queues** (Redis or Amazon SQS) | Notifications, settlement calculations, emails |
| **Scheduled tasks** | **Laravel Scheduler** | Voucher expiry, daily settlement, reminders |
| **File / media storage** | **Amazon S3** | Partner photos, storefront images, receipts, avatars |
| **CDN** | **Amazon CloudFront** | Serve S3 media and API static assets |
| **Push notifications** | **Firebase Cloud Messaging (FCM)** + **APNs**, or **Expo Push** | Optionally fronted by Amazon SNS |
| **Maps & geolocation** | **Google Maps Platform** (Maps SDK + Places + Geocoding) | Alternative: Amazon Location Service |
| **Payments** | **South African gateway** — PayFast / Peach Payments / Paystack / Yoco / Ozow (EFT) | PCI-DSS handled by the gateway; app never stores raw card data |
| **Transactional email** | **Amazon SES** | Receipts, password resets, partner onboarding |
| **Monitoring / logs** | **Amazon CloudWatch** (+ optional Sentry) | Application, infrastructure and error monitoring |

> **Note on payments:** Card processing is **not** done on AWS. It is delegated
> to a PCI-DSS compliant South African payment gateway. This keeps the platform
> out of PCI scope for card data. AWS only stores payment *references* and
> transaction metadata.

---

## 4. High-level architecture

```
                          ┌─────────────────────────┐
   iOS / Android          │   React Native App       │
   (Consumer & Partner)   │   (Expo / EAS builds)    │
                          └───────────┬─────────────┘
                                      │ HTTPS (REST/JSON)
                                      ▼
                        ┌───────────────────────────┐
                        │   Amazon Route 53 (DNS)    │
                        └─────────────┬──────────────┘
                                      ▼
                    ┌──────────────────────────────────┐
                    │   AWS WAF  →  Application Load     │
                    │             Balancer (ALB, HTTPS) │
                    └───────────────┬──────────────────┘
                                    ▼
         ┌──────────────────────────────────────────────────────┐
         │                 VPC (private subnets)                 │
         │                                                       │
         │   ┌───────────────┐   ┌───────────────┐               │
         │   │ Laravel API   │   │ Laravel Queue │               │
         │   │ (ECS Fargate) │   │ Workers (ECS) │               │
         │   │  + Admin UI   │   │  + Scheduler  │               │
         │   │  tenant-scoped│   │  settlement/  │               │
         │   │  (tenant_id)  │   │  payout jobs  │               │
         │   └──────┬────────┘   └──────┬────────┘               │
         │          │                   │                        │
         │   ┌──────▼─────┐      ┌───────▼──────┐                │
         │   │ Amazon RDS │      │  ElastiCache │                │
         │   │  (MySQL,   │      │   (Redis)    │                │
         │   │  Multi-AZ) │      └──────────────┘                │
         │   └────────────┘                                      │
         └──────────────────────────────────────────────────────┘
                                    │
             ┌──────────────┬───────┴────────┬──────────────┐
             ▼              ▼                ▼              ▼
        Amazon S3      CloudFront       Amazon SES      SNS/FCM
       (media/files)   (CDN)          (email)       (push notif)

   External (non-AWS): Payment Gateway (PayFast/Peach/etc.), Google Maps API
```

**Compute recommendation:** Run the Laravel API and admin on **Amazon ECS
Fargate** (containers, no servers to patch, auto-scaling). Acceptable
alternatives, in order of simplicity: **AWS Elastic Beanstalk** (managed,
easiest), or **EC2 Auto Scaling Group** (most control). The engineer may choose
based on the team's operational preference — the resource list in Section 7
assumes ECS Fargate and notes the Beanstalk/EC2 substitutions.

---

## 5. Environments

Three isolated environments are recommended:

| Environment | Purpose | Sizing |
|---|---|---|
| **Development** | Active development & integration | Minimal / single-AZ, smallest instances |
| **Staging** | Pre-production testing, UAT, payment gateway sandbox | Mirror of production at reduced scale |
| **Production** | Live app | Multi-AZ, auto-scaling, full monitoring |

Each environment should be a separate AWS account (or at minimum a separate VPC)
following AWS Organizations best practice, isolated by IAM.

---

## 6. Security & compliance requirements

- **HTTPS/TLS everywhere** — ACM-issued certificates on ALB/CloudFront.
- **Secrets** stored in **AWS Secrets Manager** (DB credentials, API keys,
  gateway keys) — never in code or environment files.
- **AWS WAF** in front of the ALB and CloudFront (OWASP rules, rate limiting).
- **Least-privilege IAM** roles for each service; no long-lived root keys.
- **Encryption at rest** — RDS, S3, ElastiCache all encrypted (KMS).
- **Private subnets** for compute and data; only the ALB is public.
- **POPIA compliance** (SA data protection) — data hosted in the
  **`af-south-1` (Cape Town)** region for data residency and lowest latency to
  SA users. *(Confirm all required services are available in `af-south-1`;
  fall back to `eu-west-1` for any that are not.)*
- **PCI-DSS** — card data handled entirely by the payment gateway (SAQ-A scope).
- **Backups** — automated RDS snapshots (retention ≥ 7 days), S3 versioning.
- **GuardDuty** + **CloudTrail** enabled for threat detection and audit logging.

---

## 7. AWS resource requirements (provisioning checklist)

> **This is the actionable list for the AWS Cloud Engineer.** Sizing is a
> starting recommendation for production launch and can be scaled based on load
> testing. Region: **`af-south-1` (Cape Town)** preferred.

### 7.1 Networking
| Resource | Specification / Purpose |
|---|---|
| **VPC** | 1 per environment, with public + private subnets across **2 Availability Zones** |
| **Subnets** | 2 public (ALB, NAT), 2 private-app (ECS), 2 private-data (RDS, Redis) |
| **Internet Gateway** | 1 per VPC |
| **NAT Gateway** | 1–2 (for outbound access from private subnets) |
| **Route 53** | Hosted zone for the app domain + DNS records |
| **ACM** | TLS certificates for API domain and CDN |
| **Security Groups** | Per-tier (ALB, app, data) with least-privilege rules |

### 7.2 Compute
| Resource | Specification / Purpose |
|---|---|
| **Application Load Balancer** | 1, HTTPS listener, routes to ECS API service |
| **ECS Cluster (Fargate)** | 1 per environment |
| **ECS Service — API + Admin** | 2+ tasks, e.g. **1 vCPU / 2 GB** each, auto-scaling 2→6 |
| **ECS Service — Queue Workers** | 1–2 tasks, **0.5 vCPU / 1 GB**, runs Laravel queue + scheduler |
| **Amazon ECR** | Docker image registry for the Laravel container image |
| *(Alternative)* | Elastic Beanstalk (PHP platform) **or** EC2 Auto Scaling Group (2× t3.medium) if Fargate is not preferred |

### 7.3 Data
| Resource | Specification / Purpose |
|---|---|
| **Amazon RDS (MySQL 8)** | **Multi-AZ**, start at **db.t3.medium** (2 vCPU / 4 GB), 50–100 GB gp3, automated backups. Scale to db.m6g class as usage grows |
| **Amazon ElastiCache (Redis)** | **cache.t3.small**, 1 primary + 1 replica, for cache/sessions/queues |

### 7.4 Storage & delivery
| Resource | Specification / Purpose |
|---|---|
| **Amazon S3** | Buckets for: media uploads, receipts, private documents. Versioning + encryption on |
| **Amazon CloudFront** | CDN distribution in front of S3 (and optionally the API) |

### 7.5 Messaging & notifications
| Resource | Specification / Purpose |
|---|---|
| **Amazon SES** | Transactional email (production access request needed — out of sandbox) |
| **Amazon SNS** *(optional)* | Fan-out to FCM/APNs for push, or SMS OTP |
| **Amazon SQS** *(optional)* | Managed queue backend if not using Redis for queues |

### 7.6 Security & operations
| Resource | Specification / Purpose |
|---|---|
| **AWS Secrets Manager** | DB, gateway, and third-party API credentials |
| **AWS WAF** | Attached to ALB + CloudFront |
| **AWS KMS** | Encryption keys for RDS/S3/Secrets |
| **IAM** | Roles/policies per service, least privilege |
| **CloudWatch** | Logs, metrics, alarms, dashboards |
| **CloudTrail** | API audit logging |
| **GuardDuty** | Threat detection |

### 7.7 CI/CD (deployment pipeline)
| Resource | Specification / Purpose |
|---|---|
| **AWS CodePipeline + CodeBuild** *(or GitHub Actions)* | Build Docker image → push to ECR → deploy to ECS |
| **Amazon ECR** | (listed above) container image storage |

---

## 8. Third-party / non-AWS services required

| Service | Purpose | Owner action |
|---|---|---|
| **Payment gateway** (PayFast / Peach / Paystack / Yoco / Ozow) | Card & EFT processing, PCI-DSS, **marketplace split payouts to tenants** | Merchant account + API keys; confirm sub-account/split-payout support |
| **Google Maps Platform** | Maps, places, geocoding in the app | Billing account + API key |
| **Apple Developer Program** | iOS App Store distribution | $99/yr account |
| **Google Play Console** | Android distribution | One-time $25 account |
| **Firebase (FCM)** | Push notification delivery | Free project |
| **Expo EAS** *(if using Expo)* | Managed React Native builds | Subscription (optional) |
| **Domain name** | App/API/admin domain | Register / transfer to Route 53 |

---

## 9. Indicative delivery phases

| Phase | Scope |
|---|---|
| **1. Foundation** | AWS account setup, VPC, CI/CD, Laravel API skeleton, auth, **multi-tenancy foundation (tenant model, `tenant_id` scoping, roles)**, DB schema |
| **2. Consumer core** | Onboarding, vehicles, discovery (list/map for **both fixed & mobile** tenants), booking (venue slot **and** mobile at-address flow), receipts |
| **3. Payments & settlement** | Gateway integration, ledger, commission split, **scheduled per-tenant payouts**, travel-fee handling |
| **4. Loyalty & reviews** | Voucher engine (funded from commission pool), wallet/redemption, ratings & verified reviews, notifications |
| **5. Partner experience** | In-app partner role: dashboard, booking management, services, promotions, QR sign-ups (fixed & mobile variants) |
| **6. Admin dashboard** | Tenant onboarding/approval, commission config, settlement/payout oversight, disputes, reporting |
| **7. Hardening & launch** | Load testing, security review, POPIA review, store submission |

---

## 10. Open questions for the owner

The following architectural decisions have been **confirmed** with the owner:

- **Multi-tenancy** — shared database, row-level (`tenant_id`) scoping.
- **Payments** — platform collects and settles; commission retained; scheduled
  per-tenant payouts fund the loyalty vouchers.
- **Partner surface** — delivered inside the same React Native app, role-based.

These remaining items affect the final AWS footprint and should be confirmed:

1. **Expected launch scale** — number of tenants (garages + mobile washers),
   cities, and monthly bookings at launch (drives instance sizing and cost).
2. **Preferred payment gateway** (affects integration effort and settlement flow;
   confirm it supports **marketplace split payouts** to sub-accounts).
3. **Data residency** — confirm `af-south-1` (Cape Town) as the hosting region.
4. **Budget guidance** for AWS monthly spend, to right-size dev/staging.

---

*Prepared as a shareable technical brief. Once the open questions in Section 10
are confirmed, this can be extended with a detailed cost estimate and a
formal AWS Well-Architected review.*
