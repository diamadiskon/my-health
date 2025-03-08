package controllers

import (
	"log"
	"net/http"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"

	"my-health/initializers"
	"my-health/models"
)

func GetHouseholdPatients(c *gin.Context) {
	currentUser, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}
	admin := currentUser.(models.User)

	if admin.Role != "admin" {
		c.JSON(http.StatusForbidden, gin.H{"error": "user is not an admin"})
		return
	}

	var household models.Household
	result := initializers.DB.
		Preload("Patients").
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
				"patients":     []interface{}{},
			})
			return
		}
		c.JSON(http.StatusInternalServerError, gin.H{"error": "failed to fetch household"})
		return
	}

	type PatientResponse struct {
		ID      uint   `json:"id"`
		Name    string `json:"name"`
		Surname string `json:"surname"`
	}

	var patients []PatientResponse
	for _, patient := range household.Patients {
		// Only include patients that have details set
		if patient.Name != "" && patient.Surname != "" {
			patients = append(patients, PatientResponse{
				ID:      patient.ID,
				Name:    patient.Name,
				Surname: patient.Surname,
			})
		}
	}

	c.JSON(http.StatusOK, gin.H{
		"household_id": household.ID,
		"patients":     patients,
	})
}

func CreateInvitation(c *gin.Context) {
	var requestBody struct {
		AdminID   uint `json:"admin_id"`
		PatientID uint `json:"patient_id"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		log.Printf("Error binding JSON: %v", err)
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid input"})
		return
	}

	// Fetch the household for the admin
	var household models.Household
	if err := initializers.DB.Where("admin_id = ?", requestBody.AdminID).First(&household).Error; err != nil {
		log.Printf("Error fetching household: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Household not found for the given admin"})
		return
	}

	// Check if invitation already exists
	var existingInvitation models.Invitation
	result := initializers.DB.Where("admin_id = ? AND patient_id = ? AND status = 'pending'", requestBody.AdminID, requestBody.PatientID).First(&existingInvitation)
	if result.Error == nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "A pending invitation already exists for this patient"})
		return
	}

	invitation := models.Invitation{
		AdminID:     requestBody.AdminID,
		PatientID:   requestBody.PatientID,
		HouseholdID: household.ID,
		Status:      "pending",
	}

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

func GetInvitations(c *gin.Context) {
	currentUser, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "User not found in context"})
		return
	}
	user := currentUser.(models.User)

	userID := user.ID
	var invitations []models.Invitation
	db := initializers.DB

	if err := db.
		Preload("Admin.Patient").
		Preload("Household").
		Where("patient_id = ? AND status = ?", userID, "pending").
		Find(&invitations).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to fetch invitations"})
		return
	}

	// Format response to match frontend expectations
	var formattedInvitations []gin.H
	for _, inv := range invitations {
		adminName := "Unknown"
		if inv.Admin.Patient != nil {
			adminName = inv.Admin.Patient.Name + " " + inv.Admin.Patient.Surname
		}

		formattedInvitations = append(formattedInvitations, gin.H{
			"ID":      inv.ID,
			"AdminID": inv.AdminID,
			"Status":  inv.Status,
			"Admin": gin.H{
				"name":  adminName,
				"email": inv.Admin.Username,
			},
			"Household": gin.H{
				"name": "Admin's Household",
			},
		})
	}

	c.JSON(http.StatusOK, gin.H{"invitations": formattedInvitations})
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

	var invitation models.Invitation
	if err := initializers.DB.First(&invitation, requestBody.InvitationID).Error; err != nil {
		log.Printf("Error fetching invitation: %v", err)
		c.JSON(http.StatusNotFound, gin.H{"error": "Invitation not found"})
		return
	}

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

		var user models.User
		if err := initializers.DB.First(&user, invitation.PatientID).Error; err != nil {
			log.Printf("Error fetching user: %v", err)
			c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
			return
		}

		// First try to find an existing patient record
		var patient models.Patient
		result := initializers.DB.Where("user_id = ?", user.ID).First(&patient)

		// If patient doesn't exist, create one
		if result.Error != nil {
			if result.Error == gorm.ErrRecordNotFound {
				patient = models.Patient{
					UserID: user.ID,
					User:   user,
				}
				if err := initializers.DB.Create(&patient).Error; err != nil {
					log.Printf("Error creating patient record: %v", err)
					c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create patient record"})
					return
				}
			} else {
				log.Printf("Error checking for existing patient: %v", result.Error)
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to check for existing patient"})
				return
			}
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
		household.Patients = append(household.Patients, patient)
		if err := initializers.DB.Save(&household).Error; err != nil {
			log.Printf("Error adding patient to household: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to add patient to household"})
			return
		}

		// Update the user's IsInHousehold status
		user.IsInHousehold = true
		if err := initializers.DB.Save(&user).Error; err != nil {
			log.Printf("Error updating user's household status: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update user's household status"})
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

	c.JSON(http.StatusOK, gin.H{"success": "Invitation processed successfully"})
}
