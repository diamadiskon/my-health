package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"my-health/initializers"
	"my-health/models"
)

func UpdatePatient(c *gin.Context) {
	patientID := c.Param("id")

	var patient models.Patient
	if err := initializers.DB.Preload("User").First(&patient, patientID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		return
	}

	var requestBody struct {
		Name           string `json:"name"`
		Surname        string `json:"surname"`
		DateOfBirth    string `json:"dateOfBirth"`
		Address        string `json:"address"`
		MedicalRecord  string `json:"medicalRecord"`
		Gender         string `json:"gender"`
		BloodType      string `json:"bloodType"`
		MedicalHistory string `json:"medicalHistory"`
		Allergies      string `json:"allergies"`
		Medications    string `json:"medications"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	if requestBody.Name != "" {
		patient.Name = requestBody.Name
	}
	if requestBody.Surname != "" {
		patient.Surname = requestBody.Surname
	}
	if requestBody.DateOfBirth != "" {
		dateOfBirth, err := time.Parse("2006-01-02", requestBody.DateOfBirth)
		if err != nil {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format"})
			return
		}
		patient.DateOfBirth = dateOfBirth
	}
	if requestBody.Address != "" {
		patient.Address = requestBody.Address
	}
	if requestBody.MedicalRecord != "" {
		patient.MedicalRecord = requestBody.MedicalRecord
	}
	if requestBody.Gender != "" {
		patient.Gender = requestBody.Gender
	}
	if requestBody.BloodType != "" {
		patient.BloodType = requestBody.BloodType
	}
	if requestBody.MedicalHistory != "" {
		patient.MedicalHistory = requestBody.MedicalHistory
	}
	if requestBody.Allergies != "" {
		patient.Allergies = requestBody.Allergies
	}
	if requestBody.Medications != "" {
		patient.Medications = requestBody.Medications
	}

	if err := initializers.DB.Save(&patient).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update patient"})
		return
	}

	// Calculate age after saving
	age := patient.Age()

	c.JSON(http.StatusOK, gin.H{
		"message": "Patient updated successfully",
		"patient": gin.H{
			"id":             patient.ID,
			"name":           patient.Name,
			"surname":        patient.Surname,
			"dateOfBirth":    patient.DateOfBirth,
			"age":            age,
			"address":        patient.Address,
			"medicalRecord":  patient.MedicalRecord,
			"gender":         patient.Gender,
			"bloodType":      patient.BloodType,
			"medicalHistory": patient.MedicalHistory,
			"allergies":      patient.Allergies,
			"medications":    patient.Medications,
		},
	})
}
