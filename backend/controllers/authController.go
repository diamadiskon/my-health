package controllers

import (
	"log"
	"net/http"
	"os"
	"time"

	// spell-checker: disable
	// spell-checker: enable

	"github.com/gin-gonic/gin"
	"github.com/golang-jwt/jwt/v4"
	"golang.org/x/crypto/bcrypt"

	"my-health/initializers"
	"my-health/models"
	"my-health/utils"
)

func CreateUser(c *gin.Context) {

	var authInput models.AuthInput

	if err := c.ShouldBindJSON(&authInput); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var userFound models.User
	initializers.DB.Where("username=?", authInput.Username).Find(&userFound)

	if userFound.ID != 0 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "username already used"})
		return
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(authInput.Password), bcrypt.DefaultCost)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	user := models.User{
		Username: authInput.Username,
		Password: string(passwordHash),
		Role:     authInput.Role,
	}

	initializers.DB.Create(&user)

	c.JSON(http.StatusOK, gin.H{"data": user})

}

func Login(c *gin.Context) {
	var authInput models.AuthInput

	if err := c.ShouldBindJSON(&authInput); err != nil {
		log.Printf("Failed to bind JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	var userFound models.User
	if err := initializers.DB.Where("username = ?", authInput.Username).First(&userFound).Error; err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "user not found"})
		return
	}

	if err := bcrypt.CompareHashAndPassword([]byte(userFound.Password), []byte(authInput.Password)); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "invalid password"})
		return
	}

	claims := jwt.MapClaims{
		"user_id": userFound.ID,
		"role":    userFound.Role,
		"exp":     time.Now().Add(time.Hour * 24).Unix(),
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	signedToken, err := token.SignedString([]byte(os.Getenv("SECRET")))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to generate token"})
		return
	}

	var patientDetails models.Patient
	hasDetails := true
	if userFound.Role == "patient" {
		if err := initializers.DB.Where("user_id = ?", userFound.ID).First(&patientDetails).Error; err != nil {
			hasDetails = false
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"token":      signedToken,
		"role":       userFound.Role,
		"userId":     userFound.ID,
		"hasDetails": hasDetails,
	})
}

func CheckPatientDetails(c *gin.Context) {
	userID := c.Param("userId")

	var patient models.Patient
	if err := initializers.DB.Where("user_id = ?", userID).First(&patient).Error; err != nil {
		c.JSON(http.StatusOK, gin.H{"hasDetails": false})
		return
	}

	c.JSON(http.StatusOK, gin.H{"hasDetails": true})
}

func GetUserProfile(c *gin.Context) {
	user, _ := c.Get("currentUser")

	c.JSON(200, gin.H{
		"user": user,
	})
}

func Logout(c *gin.Context) {
	c.SetCookie("token", "", -1, "/", "localhost", false, true)
	c.JSON(200, gin.H{"success": "user logged out"})
}

func Premium(c *gin.Context) {
	cookie, err := c.Cookie("token")

	if err != nil {
		c.JSON(401, gin.H{"error": "unauthorized"})
		return
	}

	claims, err := utils.ParseToken(cookie)

	if err != nil {
		c.JSON(401, gin.H{"error": "unauthorized"})
		return
	}

	if claims.Role != "admin" {
		c.JSON(401, gin.H{"error": "unauthorized"})
		return
	}

	c.JSON(200, gin.H{"success": "premium page", "role": claims.Role})
}

func AcceptPatient(c *gin.Context) {
	var requestBody struct {
		PatientID uint `json:"patient_id"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	var user models.User
	if err := initializers.DB.First(&user, requestBody.PatientID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	user.IsInHousehold = true
	if err := initializers.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": "Patient accepted into household"})
}

func GetUserDetails(c *gin.Context) {
	authHeader := c.GetHeader("Authorization")
	if authHeader == "" || len(authHeader) <= 7 || authHeader[:7] != "Bearer " {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid authorization header"})
		return
	}

	tokenString := authHeader[7:]
	claims, err := utils.ParseToken(tokenString)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
		return
	}

	var user models.User
	if err := initializers.DB.First(&user, claims.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"patientID": user.ID,
		"role":      user.Role,
	})
}
