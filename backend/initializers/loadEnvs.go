package initializers

import (
	"log"

	"github.com/joho/godotenv"
)

func LoadEnvs() {
	err := godotenv.Load()
	if err != nil {
		log.Println("Warning: .env file not found, using environment variables from system")
	}
}
