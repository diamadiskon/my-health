# GitHub Actions Setup Instructions

## Required Secrets

Configure these secrets in your GitHub repository settings:

### Azure Authentication
```
AZURE_CREDENTIALS
```
JSON object with Azure service principal credentials:
```json
{
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "subscriptionId": "your-subscription-id",
  "tenantId": "your-tenant-id"
}
```


### PostgreSQL
```
POSTGRES_ADMIN_LOGIN=pgadmin
```

## Required Variables

Configure these variables in your GitHub repository settings:

### Infrastructure Configuration
```
AZURE_LOCATION=West Europe
ENVIRONMENT=dev
APP_NAME=my-health-app
DATABASE_NAME=myhealth
```

### Container Images
```
BACKEND_IMAGE=your-registry/my-health-backend:latest
FRONTEND_IMAGE=your-registry/my-health-frontend:latest
BACKEND_PORT=3000
FRONTEND_PORT=80
```

## Environment Setup

1. **Create Environments:**
   - `dev` (for terraform plan)
   - `production` (for terraform apply/destroy with manual approval)

2. **Enable Environment Protection:**
   - Go to Settings > Environments
   - Configure `production` environment with required reviewers

## Azure Prerequisites

### 1. Create Service Principal
```bash
# Create service principal with Contributor role
az ad sp create-for-rbac --name "github-actions-my-health" \
  --role contributor \
  --scopes /subscriptions/YOUR_SUBSCRIPTION_ID \
  --sdk-auth
```

### 2. Verify Subscription Access
```bash
# Verify service principal has access
az login --service-principal \
  --username 398bce36-dd14-4290-8314-e88a3a94f2dd \
  --password H7Y8Q~KVomnQB7d-U4.I8IVwNWOCbFf6pXra2dsS \
  --tenant e86449d8-e83e-46ab-80ea-727b54c49daa

az account show
```

## Workflow Triggers

- **Pull Request:** Runs terraform plan on infra changes
- **Manual Dispatch:** Choose plan/apply/destroy actions (manual only)

## Security Notes

- Uses environment protection for production deployments
- Terraform state stored locally (ephemeral for demo purposes)
- Service principal follows least privilege principle
- Sensitive outputs are marked as secrets

⚠️ **Warning**: Without remote state, concurrent deployments may conflict. For production, consider using Azure Storage backend.