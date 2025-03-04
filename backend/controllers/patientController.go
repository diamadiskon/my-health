package controllers

import (
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"my-health/initializers"
	"my-health/models"
)

type EmergencyContactRequest struct {
	Name         string `json:"name"`
	Relationship string `json:"relationship"`
	PhoneNumber  string `json:"phoneNumber"`
}

type HealthMetricsRequest struct {
	Height           float64 `json:"height"`
	Weight           float64 `json:"weight"`
	HeartRate        int     `json:"heartRate"`
	SystolicBP       int     `json:"systolicBP"`
	DiastolicBP      int     `json:"diastolicBP"`
	OxygenSaturation float64 `json:"oxygenSaturation"`
	BloodPressure    string  `json:"bloodPressure"`
	LastCheckup      string  `json:"lastCheckup"`
}

func UpdatePatient(c *gin.Context) {
	patientID := c.Param("id")

	var patient models.Patient
	if err := initializers.DB.Preload("User").First(&patient, patientID).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		return
	}

	var requestBody struct {
		Name             string                  `json:"name"`
		Surname          string                  `json:"surname"`
		DateOfBirth      string                  `json:"dateOfBirth"`
		Address          string                  `json:"address"`
		MedicalRecord    string                  `json:"medicalRecord"`
		Gender           string                  `json:"gender"`
		BloodType        string                  `json:"bloodType"`
		MedicalHistory   string                  `json:"medicalHistory"`
		Allergies        string                  `json:"allergies"`
		Medications      string                  `json:"medications"`
		EmergencyContact EmergencyContactRequest `json:"emergencyContact"`
		HealthMetrics    HealthMetricsRequest    `json:"healthMetrics"`
	}

	if err := c.ShouldBindJSON(&requestBody); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	// Update basic information
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

	// Update emergency contact
	patient.EmergencyContact.Name = requestBody.EmergencyContact.Name
	patient.EmergencyContact.Relationship = requestBody.EmergencyContact.Relationship
	patient.EmergencyContact.PhoneNumber = requestBody.EmergencyContact.PhoneNumber

	// Start a transaction for patient update and health metrics
	tx := initializers.DB.Begin()

	// Save patient data
	if err := tx.Save(&patient).Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update patient"})
		return
	}

	// Create new health metrics if provided
	if requestBody.HealthMetrics.Height != 0 ||
		requestBody.HealthMetrics.Weight != 0 ||
		requestBody.HealthMetrics.HeartRate != 0 ||
		requestBody.HealthMetrics.BloodPressure != "" {

		var lastCheckup time.Time
		if requestBody.HealthMetrics.LastCheckup != "" {
			var err error
			lastCheckup, err = time.Parse("2006-01-02", requestBody.HealthMetrics.LastCheckup)
			if err != nil {
				lastCheckup = time.Now()
			}
		} else {
			lastCheckup = time.Now()
		}

		healthMetrics := models.HealthMetrics{
			PatientID:        patient.ID,
			Date:             lastCheckup,
			Height:           requestBody.HealthMetrics.Height,
			Weight:           requestBody.HealthMetrics.Weight,
			HeartRate:        requestBody.HealthMetrics.HeartRate,
			SystolicBP:       requestBody.HealthMetrics.SystolicBP,
			DiastolicBP:      requestBody.HealthMetrics.DiastolicBP,
			OxygenSaturation: requestBody.HealthMetrics.OxygenSaturation,
			BloodPressure:    requestBody.HealthMetrics.BloodPressure,
		}

		if err := tx.Create(&healthMetrics).Error; err != nil {
			tx.Rollback()
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update health metrics"})
			return
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save changes"})
		return
	}

	// Get latest health metrics for response
	var healthMetrics models.HealthMetrics
	initializers.DB.Where("patient_id = ?", patient.ID).Order("created_at desc").First(&healthMetrics)

	c.JSON(http.StatusOK, gin.H{
		"message": "Patient updated successfully",
		"patient": gin.H{
			"id":             patient.ID,
			"name":           patient.Name,
			"surname":        patient.Surname,
			"dateOfBirth":    patient.DateOfBirth.Format("2006-01-02"),
			"age":            patient.Age(),
			"address":        patient.Address,
			"medicalRecord":  patient.MedicalRecord,
			"gender":         patient.Gender,
			"bloodType":      patient.BloodType,
			"medicalHistory": patient.MedicalHistory,
			"allergies":      patient.Allergies,
			"medications":    patient.Medications,
			"emergencyContact": gin.H{
				"name":         patient.EmergencyContact.Name,
				"relationship": patient.EmergencyContact.Relationship,
				"phoneNumber":  patient.EmergencyContact.PhoneNumber,
			},
			"healthMetrics": gin.H{
				"height":           healthMetrics.Height,
				"weight":           healthMetrics.Weight,
				"heartRate":        healthMetrics.HeartRate,
				"systolicBP":       healthMetrics.SystolicBP,
				"diastolicBP":      healthMetrics.DiastolicBP,
				"oxygenSaturation": healthMetrics.OxygenSaturation,
				"bloodPressure":    healthMetrics.BloodPressure,
				"lastCheckup":      healthMetrics.Date.Format("2006-01-02"),
			},
		},
	})
}
