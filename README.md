# PortTrack Sample (Module 7)

Minimal Node/Express app ready for **Rolling** deployments with **AWS CodeDeploy** + **GitHub Actions**.  
Includes health checks, JSON logs (for ELK/Filebeat), and CloudWatch Agent config.

## Run locally
```bash
cd app
cp .env.example .env
npm ci
npm start
# http://localhost:3000/health
```

## Deploy (overview)
1. **EC2** instances behind **ALB**, with **CodeDeploy agent** installed.
2. **CodeDeploy**: Application `porttrack-app`, Deployment Groups `dg-dev|test|stg|prd`.
3. **S3** bucket `porttrack-artifacts` (KMS, Block Public Access).
4. **GitHub Actions** uses **OIDC** to assume `ga-deploy-role` and runs the workflow in `.github/workflows/deploy-porttrack.yml`.
5. **Rolling** happens in-place per batch. Hooks: `BeforeInstall`→`AfterInstall`→`ApplicationStart`→`ValidateService`.

## Secrets (PRD)
- Set `DB_SECRET_ARN` and `AWS_REGION` in the EC2 environment (systemd Environment or Secrets Manager->env injection in your bootstrap).
- The app will attempt to read the secret (logs only keys, never values).

## Observability
- **CloudWatch Agent** sample config in `infra/cloudwatch-agent-config.json` (CPU/Mem/Disk).
- **Filebeat** sample in `infra/filebeat.yml` (reads journald for `porttrack.service`, ships to Logstash).

## Endpoints
- `GET /health` — used by CodeDeploy validation.
- `GET /ships` — list demo ships.
- `POST /ships` — create ship `{ name, status?, cargo?, eta? }`.
- `GET /error` — returns 500 for testing alarms.

## Systemd service
`start_service.sh` creates/updates a unit file `porttrack.service` and starts it.

## Notes
- Replace `<ACCOUNT_ID>`, `<REGION>`, `<LOGSTASH_HOST>` in workflow/configs.
- Ensure IAM least-privilege for the GA role and EC2 instance profile.
