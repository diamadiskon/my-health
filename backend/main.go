package main

import (
	"net/http"

	"github.com/gin-gonic/gin"

	"my-health/initializers"
	"my-health/routes"
)

func init() {
	initializers.LoadEnvs()
	initializers.ConnectDatabase()
	initializers.SyncDatabase()

}

// CORS Middleware
func CORS(c *gin.Context) {
	c.Header("Access-Control-Allow-Origin", "http://localhost:3000") // specify frontend origin explicitly
	c.Header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS")
	c.Header("Access-Control-Allow-Headers", "Authorization, Content-Type")
	c.Header("Access-Control-Allow-Credentials", "true")
	c.Header("Access-Control-Max-Age", "43200") // 12 hours in seconds
	c.Header("Access-Control-Expose-Headers", "Authorization")

	// Handle OPTIONS requests
	if c.Request.Method == "OPTIONS" {
		c.AbortWithStatus(http.StatusOK)
		return
	}

	c.Next()
}

func main() {
	router := gin.Default()
	router.Use(CORS)
	routes.SetupRoutes(router)

	router.Run(":8080")
}
