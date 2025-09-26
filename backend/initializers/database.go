package initializers

import (
	"log"
	"os"

	"gorm.io/driver/postgres"
	"gorm.io/gorm"

	"my-health/models"
)

var DB *gorm.DB

func ConnectDatabase() {
	// Get environment variables
	dbHost := os.Getenv("DB_HOST")
	dbUser := os.Getenv("DB_USER")
	dbPassword := os.Getenv("DB_PASSWORD")
	dbName := os.Getenv("DB_NAME")

	dsn := "host=" + dbHost + " user=" + dbUser + " password=" + dbPassword + " dbname=" + dbName + " port=5432 sslmode=disable"
	database, err := gorm.Open(postgres.Open(dsn), &gorm.Config{})
	if err != nil {
		log.Fatalf("Failed to connect to DB: %v", err)
	}
	if err := database.AutoMigrate(&models.User{}, &models.Patient{}, &models.Household{},
		&models.Invitation{}, &models.HealthMetrics{}, &models.ChatSession{}, &models.ChatMessage{},
	); err != nil {
		panic(err)
	}

	DB = database
	log.Println("Database connection established")
}
func SyncDatabase() {
	err := DB.AutoMigrate(
		&models.User{},
		&models.Patient{},
		&models.Household{},
		&models.HealthMetrics{},
		&models.Invitation{},
		&models.ChatSession{},
		&models.ChatMessage{},
	)
	if err != nil {
		log.Fatal("Failed to sync database:", err)
	}
}
