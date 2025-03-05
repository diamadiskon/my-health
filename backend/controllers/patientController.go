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

	var patient models.Patient
	result := initializers.DB.Where("id = ? OR user_id = ?", patientID, patientID).First(&patient)

	if result.Error != nil {
		// If patient doesn't exist, look up the user to link it
		var user models.User
		if err := initializers.DB.First(&user, patientID).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient/User not found"})
			return
		}
		patient = models.Patient{
			UserID: user.ID,
		}
	}

	// Parse and validate date of birth
	dateOfBirth, err := time.Parse("2006-01-02", requestBody.DateOfBirth)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format for date of birth"})
		return
	}
	patient.DateOfBirth = dateOfBirth

	// Update basic information
	patient.Name = requestBody.Name
	patient.Surname = requestBody.Surname
	patient.Address = requestBody.Address
	patient.MedicalRecord = requestBody.MedicalRecord
	patient.Gender = requestBody.Gender
	patient.BloodType = requestBody.BloodType
	patient.MedicalHistory = requestBody.MedicalHistory
	patient.Allergies = requestBody.Allergies
	patient.Medications = requestBody.Medications

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

	// Update or create health metrics if provided
	if requestBody.HealthMetrics.Height != 0 ||
		requestBody.HealthMetrics.Weight != 0 ||
		requestBody.HealthMetrics.BloodPressure != "" {

		lastCheckup, err := time.Parse("2006-01-02", requestBody.HealthMetrics.LastCheckup)
		if err != nil {
			lastCheckup = time.Now()
		}

		// Try to find existing health metrics
		var healthMetrics models.HealthMetrics
		result := tx.Where("patient_id = ?", patient.ID).Order("created_at desc").First(&healthMetrics)

		if result.Error != nil {
			// Create new health metrics if none exist
			healthMetrics = models.HealthMetrics{
				PatientID:        patient.ID,
				Height:           requestBody.HealthMetrics.Height,
				Weight:           requestBody.HealthMetrics.Weight,
				HeartRate:        requestBody.HealthMetrics.HeartRate,
				SystolicBP:       requestBody.HealthMetrics.SystolicBP,
				DiastolicBP:      requestBody.HealthMetrics.DiastolicBP,
				OxygenSaturation: requestBody.HealthMetrics.OxygenSaturation,
				BloodPressure:    requestBody.HealthMetrics.BloodPressure,
				Date:             lastCheckup,
			}
			if err := tx.Create(&healthMetrics).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create health metrics"})
				return
			}
		} else {
			// Update existing health metrics
			healthMetrics.Height = requestBody.HealthMetrics.Height
			healthMetrics.Weight = requestBody.HealthMetrics.Weight
			healthMetrics.HeartRate = requestBody.HealthMetrics.HeartRate
			healthMetrics.SystolicBP = requestBody.HealthMetrics.SystolicBP
			healthMetrics.DiastolicBP = requestBody.HealthMetrics.DiastolicBP
			healthMetrics.OxygenSaturation = requestBody.HealthMetrics.OxygenSaturation
			healthMetrics.BloodPressure = requestBody.HealthMetrics.BloodPressure
			healthMetrics.Date = lastCheckup
			if err := tx.Save(&healthMetrics).Error; err != nil {
				tx.Rollback()
				c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update health metrics"})
				return
			}
		}
	}

	// Commit transaction
	if err := tx.Commit().Error; err != nil {
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save changes"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Patient updated successfully",
		"patient": gin.H{
			"id":             patient.ID,
			"name":           patient.Name,
			"surname":        patient.Surname,
			"dateOfBirth":    patient.DateOfBirth.Format("2006-01-02"),
			"gender":         patient.Gender,
			"bloodType":      patient.BloodType,
			"medicalRecord":  patient.MedicalRecord,
			"medicalHistory": patient.MedicalHistory,
			"allergies":      patient.Allergies,
			"medications":    patient.Medications,
			"emergencyContact": gin.H{
				"name":         patient.EmergencyContact.Name,
				"relationship": patient.EmergencyContact.Relationship,
				"phoneNumber":  patient.EmergencyContact.PhoneNumber,
			},
		},
	})
}

func GetPatientDetails(c *gin.Context) {
	patientID := c.Param("id")

	var patient models.Patient
	if err := initializers.DB.Where("id = ? OR user_id = ?", patientID, patientID).First(&patient).Error; err != nil {
		c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
		return
	}

	// Get latest health metrics
	var healthMetrics models.HealthMetrics
	if err := initializers.DB.Where("patient_id = ?", patient.ID).Order("created_at desc").First(&healthMetrics).Error; err != nil {
		healthMetrics = models.HealthMetrics{}
	}

	c.JSON(http.StatusOK, gin.H{
		"patient": gin.H{
			"id":             patient.ID,
			"name":           patient.Name,
			"surname":        patient.Surname,
			"dateOfBirth":    patient.DateOfBirth.Format("2006-01-02"),
			"gender":         patient.Gender,
			"bloodType":      patient.BloodType,
			"medicalRecord":  patient.MedicalRecord,
			"medicalHistory": patient.MedicalHistory,
			"allergies":      patient.Allergies,
			"medications":    patient.Medications,
			"emergencyContact": gin.H{
				"name":         patient.EmergencyContact.Name,
				"relationship": patient.EmergencyContact.Relationship,
				"phoneNumber":  patient.EmergencyContact.PhoneNumber,
			},
			"healthMetrics": gin.H{
				"height":        healthMetrics.Height,
				"weight":        healthMetrics.Weight,
				"heartRate":     healthMetrics.HeartRate,
				"bloodPressure": healthMetrics.BloodPressure,
				"lastCheckup":   healthMetrics.Date.Format("2006-01-02"),
			},
		},
	})
}
