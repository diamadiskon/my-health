output "frontend_url" {
  description = "URL of the Frontend Container App"
  value       = "https://${azurerm_container_app.frontend.latest_revision_fqdn}"
}

output "backend_url" {
  description = "URL of the Backend Container App"
  value       = "https://${azurerm_container_app.backend.latest_revision_fqdn}"
}

output "acr_login_server" {
  description = "Azure Container Registry login server"
  value       = azurerm_container_registry.main.login_server
}

output "acr_admin_username" {
  description = "Azure Container Registry admin username"
  value       = azurerm_container_registry.main.admin_username
}

output "acr_admin_password" {
  description = "Azure Container Registry admin password"
  value       = azurerm_container_registry.main.admin_password
  sensitive   = true
}

output "postgres_server_fqdn" {
  description = "FQDN of the PostgreSQL server"
  value       = azurerm_postgresql_flexible_server.main.fqdn
}

output "postgres_admin_login" {
  description = "PostgreSQL administrator login"
  value       = var.postgres_admin_login
}

output "postgres_password" {
  description = "PostgreSQL administrator password"
  value       = random_password.postgres_password.result
  sensitive   = true
}

output "database_name" {
  description = "Name of the PostgreSQL database"
  value       = var.database_name
}

output "resource_group_name" {
  description = "Name of the resource group"
  value       = data.azurerm_resource_group.existing.name
}

output "connection_string" {
  description = "PostgreSQL connection string"
  value       = "postgresql://${var.postgres_admin_login}:${random_password.postgres_password.result}@${azurerm_postgresql_flexible_server.main.fqdn}:5432/${var.database_name}?sslmode=require"
  sensitive   = true
}