package main

import (
	"log"

	"my-health/initializers"
)

func init() {
	initializers.LoadEnvs()
	initializers.ConnectDatabase()
}

func main() {
	log.Println("Starting database migration...")

	// Use the SyncDatabase function which already includes all models
	initializers.SyncDatabase()

	log.Println("Database migration completed successfully")
}
