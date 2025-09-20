# My Health App Infrastructure

This Terraform configuration creates Azure infrastructure for the My Health application using:

- **Azure Container Apps** for hosting the application
- **PostgreSQL Flexible Server** for the database
- **Log Analytics Workspace** for monitoring

## Resources Created

- Resource Group: `rg-dk`
- Container Apps Environment with Log Analytics
- PostgreSQL Flexible Server (publicly accessible for demo)
- Container App with auto-scaling (1-3 replicas)

## Prerequisites

1. Azure CLI installed and authenticated
2. Terraform installed (>= 1.0)
3. Container image built and pushed to a registry

## Usage

1. Copy the example variables file:
   ```bash
   cp terraform.tfvars.example terraform.tfvars
   ```

2. Edit `terraform.tfvars` with your values:
   - Update `container_image` with your actual image
   - Adjust `container_port` if needed
   - Modify other settings as required

3. Initialize Terraform:
   ```bash
   terraform init
   ```

4. Plan the deployment:
   ```bash
   terraform plan
   ```

5. Apply the configuration:
   ```bash
   terraform apply
   ```

## Outputs

After deployment, Terraform will output:
- `container_app_url`: Public URL of your application
- `postgres_server_fqdn`: PostgreSQL server endpoint
- `connection_string`: Database connection string (sensitive)

## Security Notes

⚠️ **For demonstration purposes only**:
- PostgreSQL server allows connections from all IPs (0.0.0.0-255.255.255.255)
- Container App is publicly accessible
- In production, implement proper network security and private endpoints

## Cleanup

To destroy all resources:
```bash
terraform destroy
```