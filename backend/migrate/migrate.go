package main

import (
	"my-health/initializers"
	"my-health/models"
)

func init() {
	initializers.LoadEnvs()
	initializers.ConnectDatabase()

}

func main() {
	// Migrate the schema
	initializers.DB.AutoMigrate(&models.User{})
}
