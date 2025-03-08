package middlewares

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"

	"my-health/initializers"
	"my-health/models"
)

func CheckAuth(c *gin.Context) {

	authHeader := c.GetHeader("Authorization")

	if authHeader == "" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authorization header is missing"})
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	authToken := strings.Split(authHeader, " ")
	if len(authToken) != 2 || authToken[0] != "Bearer" {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token format"})
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	tokenString := authToken[1]
	token, err := jwt.Parse(tokenString, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("Unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(os.Getenv("SECRET")), nil
	})
	if err != nil || !token.Valid {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid or expired token"})
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	claims, ok := token.Claims.(jwt.MapClaims)
	if !ok {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid token claims"})
		c.Abort()
		return
	}

	// Log claims for debugging
	log.Printf("Token claims: %+v", claims)

	if float64(time.Now().Unix()) > claims["exp"].(float64) {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Token expired"})
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	var user models.User
	userIDInterface := claims["user_id"]
	if userIDInterface == nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "No user_id in token"})
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	var userID uint
	switch v := userIDInterface.(type) {
	case float64:
		userID = uint(v)
	case float32:
		userID = uint(v)
	case int:
		userID = uint(v)
	case int32:
		userID = uint(v)
	case int64:
		userID = uint(v)
	case uint:
		userID = v
	case uint32:
		userID = uint(v)
	case uint64:
		userID = uint(v)
	default:
		log.Printf("Invalid user_id type in token: %T", userIDInterface)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Invalid user_id type in token"})
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	if err := initializers.DB.First(&user, userID).Error; err != nil {
		log.Printf("Failed to find user with ID %v: %v", userID, err)
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found"})
		c.AbortWithStatus(http.StatusUnauthorized)
		return
	}

	log.Printf("Successfully authenticated user: ID=%v, Role=%v", user.ID, user.Role)
	c.Set("currentUser", user)

	c.Next()

}
