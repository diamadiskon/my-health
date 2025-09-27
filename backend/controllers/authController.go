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

	// If the user role is "patient", also create a corresponding patient record
	if authInput.Role == "patient" {
		patient := models.Patient{
			UserID: user.ID,
			// Initialize with empty/default values that can be filled later
			Name:    "",
			Surname: "",
			// Other fields will be nil/empty and can be updated later
		}
		initializers.DB.Create(&patient)
	}

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

	// Log token claims for debugging
	log.Printf("Creating token with claims: %+v", claims)

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

func GetAdminProfile(c *gin.Context) {
	currentUser, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user := currentUser.(models.User)
	if user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	// Reload user with associations
	var fullUser models.User
	if err := initializers.DB.Preload("Patient").First(&fullUser, user.ID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "user not found"})
		return
	}

	response := gin.H{
		"id":       fullUser.ID,
		"username": fullUser.Username,
		"role":     fullUser.Role,
	}

	// Add patient information if it exists
	if fullUser.Patient != nil {
		response["name"] = fullUser.Patient.Name
		response["surname"] = fullUser.Patient.Surname
		response["address"] = fullUser.Patient.Address
		response["gender"] = fullUser.Patient.Gender
		if !fullUser.Patient.DateOfBirth.IsZero() {
			response["dateOfBirth"] = fullUser.Patient.DateOfBirth.Format("2006-01-02")
		}
		response["emergencyContactName"] = fullUser.Patient.EmergencyContact.Name
		response["emergencyContactRelationship"] = fullUser.Patient.EmergencyContact.Relationship
		response["emergencyContactPhone"] = fullUser.Patient.EmergencyContact.PhoneNumber
	}

	c.JSON(http.StatusOK, response)
}

func UpdateAdminProfile(c *gin.Context) {
	currentUser, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "unauthorized"})
		return
	}

	user := currentUser.(models.User)
	if user.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "access denied"})
		return
	}

	var requestBody struct {
		Username                       string `json:"username"`
		Password                       string `json:"password,omitempty"`
		Name                          string `json:"name"`
		Surname                       string `json:"surname"`
		Address                       string `json:"address"`
		DateOfBirth                   string `json:"dateOfBirth"`
		Gender                        string `json:"gender"`
		EmergencyContactName          string `json:"emergencyContactName"`
		EmergencyContactRelationship  string `json:"emergencyContactRelationship"`
		EmergencyContactPhone         string `json:"emergencyContactPhone"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Check if username is already taken by another user
	if requestBody.Username != "" && requestBody.Username != user.Username {
		var existingUser models.User
		if err := initializers.DB.Where("username = ? AND id != ?", requestBody.Username, user.ID).First(&existingUser).Error; err == nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "username already exists"})
			return
		}
		user.Username = requestBody.Username
	}

	// Update password if provided
	if requestBody.Password != "" {
		passwordHash, err := bcrypt.GenerateFromPassword([]byte(requestBody.Password), bcrypt.DefaultCost)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
			return
		}
		user.Password = string(passwordHash)
	}

	if err := initializers.DB.Save(&user).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile"})
		return
	}

	// Handle patient record for admin personal information
	var patient models.Patient
	result := initializers.DB.Where("user_id = ?", user.ID).First(&patient)

	if result.Error != nil {
		// Create new patient record for admin
		patient = models.Patient{
			UserID: user.ID,
		}
	}

	// Update patient information
	if requestBody.Name != "" {
		patient.Name = requestBody.Name
	}
	if requestBody.Surname != "" {
		patient.Surname = requestBody.Surname
	}
	if requestBody.Address != "" {
		patient.Address = requestBody.Address
	}
	if requestBody.Gender != "" {
		patient.Gender = requestBody.Gender
	}
	if requestBody.DateOfBirth != "" {
		// Parse the date string
		if parsedDate, err := time.Parse("2006-01-02", requestBody.DateOfBirth); err == nil {
			patient.DateOfBirth = parsedDate
		}
	}

	// Update emergency contact
	if requestBody.EmergencyContactName != "" {
		patient.EmergencyContact.Name = requestBody.EmergencyContactName
	}
	if requestBody.EmergencyContactRelationship != "" {
		patient.EmergencyContact.Relationship = requestBody.EmergencyContactRelationship
	}
	if requestBody.EmergencyContactPhone != "" {
		patient.EmergencyContact.PhoneNumber = requestBody.EmergencyContactPhone
	}

	// Save patient record
	if err := initializers.DB.Save(&patient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to update profile information"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Profile updated successfully",
		"user": gin.H{
			"id":       user.ID,
			"username": user.Username,
			"role":     user.Role,
		},
	})
}
