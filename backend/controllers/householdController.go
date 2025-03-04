package controllers

import (
	"errors"
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"my-health/initializers"
	"my-health/models"
	"my-health/utils"
)

func GetHouseholdPatients(c *gin.Context) {
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

	var admin models.User
	if err := initializers.DB.First(&admin, claims.UserID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "admin not found"})
		return
	}

	if admin.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "user is not an admin"})
		return
	}

	var household models.Household
	result := initializers.DB.
		Preload("Patients.User").
		Where("admin_id = ?", admin.ID).
		First(&household)

	if result.Error != nil {
		if result.Error == gorm.ErrRecordNotFound {
			household = models.Household{
				AdminID: admin.ID,
			}
			if err := initializers.DB.Create(&household).Error; err != nil {
				c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to create household"})
				return
			}
			c.JSON(http.StatusOK, gin.H{
				"household_id": household.ID,
				"patients":     []models.User{},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch household"})
		return
	}

	type PatientResponse struct {
		ID       uint   `json:"id"`
		Username string `json:"username"`
	}

	var patients []PatientResponse
	for _, patient := range household.Patients {
		if patient.User.IsPatient() { // Use IsPatient method
			patients = append(patients, PatientResponse{
				ID:       patient.ID,
				Username: patient.User.Username,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"household_id": household.ID,
		"patients":     patients,
	})
}

// Add this function to check if a household exists
type HouseholdController struct {
	DB *gorm.DB
}

func (h *HouseholdController) householdExists(householdID uint) bool {
	var household models.Household
	result := h.DB.First(&household, householdID)
	return result.Error == nil
}

func (h *HouseholdController) CreateInvitation(c *gin.Context) {
	var requestBody struct {
		AdminID   uint `json:"admin_id"`
		PatientID uint `json:"patient_id"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	log.Printf("Received request body: %+v", requestBody)

	// Fetch the household for the admin
	var household models.Household
	if err := initializers.DB.Where("admin_id = ?", requestBody.AdminID).First(&household).Error; err != nil {
		log.Printf("Error fetching household: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Household not found for the given admin"})
		return
	}

	invitation := models.Invitation{
		AdminID:     requestBody.AdminID,
		PatientID:   requestBody.PatientID,
		HouseholdID: household.ID,
		Status:      "pending",
	}

	log.Printf("Creating invitation: %+v", invitation)

	if err := initializers.DB.Create(&invitation).Error; err != nil {
		log.Printf("Error creating invitation: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": err.Error()})
		return
	}

	var patient models.User
	if err := initializers.DB.First(&patient, requestBody.PatientID).Error; err != nil {
		log.Printf("Error fetching patient: %v", err)
		if err == gorm.ErrRecordNotFound {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient ID does not exist"})
		} else {
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch patient"})
		}
		return
	}

	if patient.Role == "admin" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Cannot invite an admin as a patient"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": "Invitation created successfully", "invitation_id": invitation.ID})
}

func RespondToInvitation(c *gin.Context) {
	var requestBody struct {
		InvitationID uint   `json:"invitation_id"`
		Response     string `json:"response"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	log.Printf("Received request to respond to invitation: %+v", requestBody)

	var invitation models.Invitation
	if err := initializers.DB.First(&invitation, requestBody.InvitationID).Error; err != nil {
		log.Printf("Error fetching invitation: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Invitation not found"})
		return
	}

	log.Printf("Fetched invitation: %+v", invitation)

	if invitation.Status != "pending" {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invitation has already been processed"})
		return
	}

	if requestBody.Response == "accept" {
		invitation.Status = "accepted"

		var household models.Household
		if err := initializers.DB.Preload("Patients").First(&household, invitation.HouseholdID).Error; err != nil {
			log.Printf("Error fetching household: %v", err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Household not found"})
			return
		}

		var patient models.User
		if err := initializers.DB.First(&patient, invitation.PatientID).Error; err != nil {
			log.Printf("Error fetching patient: %v", err)
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
			return
		}

		// Check if the patient is already in the household
		for _, existingPatient := range household.Patients {
			if existingPatient.ID == patient.ID {
				log.Printf("Patient %d is already in household %d", patient.ID, household.ID)
				c.JSON(http.StatusBadRequest, gin.H{"error": "Patient is already in the household"})
				return
			}
		}

		// Add the patient to the household
		household.Patients = append(household.Patients, models.Patient{User: patient})
		if err := initializers.DB.Save(&household).Error; err != nil {
			log.Printf("Error adding patient to household: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add patient to household"})
			return
		}

		// Update the patient's IsInHousehold status
		patient.IsInHousehold = true
		if err := initializers.DB.Save(&patient).Error; err != nil {
			log.Printf("Error updating patient's household status: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update patient's household status"})
			return
		}

		log.Printf("Successfully added patient %d to household %d", patient.ID, household.ID)
	} else if requestBody.Response == "reject" {
		invitation.Status = "rejected"
	} else {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid response"})
		return
	}

	if err := initializers.DB.Save(&invitation).Error; err != nil {
		log.Printf("Error saving invitation: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update invitation"})
		return
	}

	log.Printf("Successfully processed invitation %d with response: %s", invitation.ID, requestBody.Response)
	c.JSON(http.StatusOK, gin.H{"success": "Invitation processed successfully"})
}

func GetInvitations(c *gin.Context) {
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

	userID := claims.UserID
	var invitations []models.Invitation
	db := initializers.DB

	if err := db.Where("patient_id = ?", userID).Find(&invitations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invitations"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"invitations": invitations})
}

func GetPatientDetails(c *gin.Context) {
	patientID := c.Param("id")

	var user models.Patient
	if err := initializers.DB.First(&user, patientID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"id": user.ID,

		"dateOfBirth": user.DateOfBirth,
	})
}

func UpdatePatientDetails(c *gin.Context) {
	id := c.Param("id")
	var patient models.Patient

	// Check if patient exists
	if err := initializers.DB.First(&patient, id).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Database error"})
		return
	}

	// Bind request body
	var updateData struct {
		Name        string `json:"name"`
		Email       string `json:"email"`
		DateOfBirth string `json:"date_of_birth"`
	}
	if err := c.ShouldBindJSON(&updateData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Update patient record
	patient.Name = updateData.Name
	if err := initializers.DB.Save(&patient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update patient"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"success": "Patient updated successfully", "patient": patient})
}
