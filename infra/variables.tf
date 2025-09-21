variable "location" {
  description = "The Azure region where resources will be created"
  type        = string
  default     = "West Europe"
}

variable "environment" {
  description = "Environment name (dev, staging, prod)"
  type        = string
  default     = "dev"
}

variable "app_name" {
  description = "Name of the application"
  type        = string
  default     = "my-health-app"
}

variable "acr_name" {
  description = "Name of the Azure Container Registry"
  type        = string
  default     = "myhealthacr001"
}

variable "backend_image" {
  description = "Container image for the backend application"
  type        = string
  default     = "nginx:latest"
}

variable "frontend_image" {
  description = "Container image for the frontend application"
  type        = string
  default     = "nginx:latest"
}

variable "backend_port" {
  description = "Port that the backend container listens on"
  type        = number
  default     = 3000
}

variable "frontend_port" {
  description = "Port that the frontend container listens on"
  type        = number
  default     = 80
}

variable "postgres_admin_login" {
  description = "Administrator login for PostgreSQL server"
  type        = string
  default     = "pgadmin"
}

variable "database_name" {
  description = "Name of the PostgreSQL database"
  type        = string
  default     = "myhealth"
}

variable "existing_resource_group_name" {
  description = "Name of an already existing Azure Resource Group to deploy resources into"
  type        = string
  default     = "rg-dk"
}