package controllers

import (
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"

	"my-health/initializers"
	"my-health/models"
	"my-health/services/mockhealth"
)

// ensurePatientMetrics checks and generates health metrics if needed
func ensurePatientMetrics(patientID uint) error {
	// Check for data in the last 30 days
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30)
	var metrics []models.HealthMetrics

	if err := initializers.DB.Where("patient_id = ? AND date >= ?", patientID, thirtyDaysAgo).
		Order("date ASC").
		Find(&metrics).Error; err != nil {
		return err
	}

	// If we have no data at all, generate full history
	if len(metrics) == 0 {
		if err := mockhealth.GenerateHistoricalData(patientID); err != nil {
			return err
		}
		mockhealth.StartPatientDataWorker(patientID)
		return nil
	}

	// Generate mock data for missing dates
	existingDates := make(map[string]bool)
	for _, metric := range metrics {
		existingDates[metric.Date.Format("2006-01-02")] = true
	}

	now := time.Now()
	for d := thirtyDaysAgo; d.Before(now) || d.Equal(now); d = d.AddDate(0, 0, 1) {
		dateStr := d.Format("2006-01-02")
		if !existingDates[dateStr] {
			if _, err := mockhealth.GenerateMockDataForPatient(patientID, d); err != nil {
				return err
			}
		}
	}

	mockhealth.StartPatientDataWorker(patientID)
	return nil
}

// validateBloodPressure checks if blood pressure values are within normal range
func validateBloodPressure(systolic, diastolic int) bool {
	return systolic >= 70 && systolic <= 190 && diastolic >= 40 && diastolic <= 130
}

type EmergencyContactRequest struct {
	Name         string `json:"name"`
	Relationship string `json:"relationship"`
	PhoneNumber  string `json:"phoneNumber"`
}

type HealthMetricsRequest struct {
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
		Height           float64                 `json:"height"`
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

	// Validate blood pressure if provided
	if requestBody.HealthMetrics.SystolicBP != 0 || requestBody.HealthMetrics.DiastolicBP != 0 {
		if !validateBloodPressure(requestBody.HealthMetrics.SystolicBP, requestBody.HealthMetrics.DiastolicBP) {
			c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid blood pressure values"})
			return
		}
	}

	var patient models.Patient
	// First try to find by ID
	result := initializers.DB.Where("id = ?", patientID).First(&patient)

	if result.Error != nil {
		// If not found by ID, specifically check if this is a user_id case
		var checkPatient models.Patient
		checkResult := initializers.DB.Where("user_id = ?", patientID).First(&checkPatient)

		if checkResult.Error != nil {
			// Patient doesn't exist, check if user exists and create patient record
			var user models.User
			userResult := initializers.DB.Where("id = ?", patientID).First(&user)
			
			if userResult.Error != nil {
				c.JSON(http.StatusNotFound, gin.H{"error": "User not found"})
				return
			}

			if user.Role != "patient" {
				c.JSON(http.StatusBadRequest, gin.H{"error": "User is not a patient"})
				return
			}

			// Create new patient record for existing user
			patient = models.Patient{
				UserID: user.ID,
				Name:   "", // Will be filled from request
				Surname: "", // Will be filled from request
			}
			
			log.Printf("Creating new patient record for user ID: %d", user.ID)
		} else {
			patient = checkPatient
		}
	}

	// Log which patient we're updating
	log.Printf("Updating patient - ID: %d, UserID: %d", patient.ID, patient.UserID)

	// Parse and validate date of birth
	dateOfBirth, err := time.Parse("2006-01-02", requestBody.DateOfBirth)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid date format for date of birth"})
		return
	}
	patient.DateOfBirth = dateOfBirth

	// Update basic information and log the data types
	log.Printf("Received height value: %v (type: %T)", requestBody.Height, requestBody.Height)
	log.Printf("Updating patient with data - Height: %v, Address: %v", requestBody.Height, requestBody.Address)
	patient.Name = requestBody.Name
	patient.Surname = requestBody.Surname
	patient.Address = requestBody.Address
	patient.MedicalRecord = requestBody.MedicalRecord
	patient.Gender = requestBody.Gender
	patient.BloodType = requestBody.BloodType
	patient.Height = requestBody.Height
	patient.MedicalHistory = requestBody.MedicalHistory
	log.Printf("Patient data after assignment - Height: %v, Address: %v", patient.Height, patient.Address)
	patient.Allergies = requestBody.Allergies
	patient.Medications = requestBody.Medications

	// Update emergency contact
	patient.EmergencyContact.Name = requestBody.EmergencyContact.Name
	patient.EmergencyContact.Relationship = requestBody.EmergencyContact.Relationship
	patient.EmergencyContact.PhoneNumber = requestBody.EmergencyContact.PhoneNumber

	// Start a transaction for patient update and health metrics
	tx := initializers.DB.Begin()

	// Debug logging
	log.Printf("Request Body: %+v\n", requestBody)
	log.Printf("Patient before save: %+v\n", patient)
	log.Printf("Blood Type from request: %q\n", requestBody.BloodType)

	// Save patient data
	if err := tx.Save(&patient).Error; err != nil {
		log.Printf("Error during save: %v\n", err)
		tx.Rollback()
		log.Printf("Error saving patient: %v\n", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update patient"})
		return
	}

	// Debug logging after save
	var savedPatient models.Patient
	if err := tx.First(&savedPatient, patient.ID).Error; err != nil {
		log.Printf("Error fetching saved patient: %v\n", err)
	} else {
		log.Printf("Patient after save: %+v\n", savedPatient)
		log.Printf("Saved blood type value: %q\n", savedPatient.BloodType)
		// Direct database query to verify
		var dbPatient models.Patient
		if err := tx.Raw("SELECT * FROM patients WHERE id = ?", patient.ID).Scan(&dbPatient).Error; err != nil {
			log.Printf("Error in verification query: %v", err)
		} else {
			log.Printf("Blood type from direct DB query: %q\n", dbPatient.BloodType)
		}
	}

	// Update or create health metrics if provided
	if requestBody.HealthMetrics.Weight != 0 ||
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
	log.Printf("Committing transaction...")
	if err := tx.Commit().Error; err != nil {
		log.Printf("Error committing transaction: %v", err)
		tx.Rollback()
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to save changes"})
		return
	}
	log.Printf("Transaction committed successfully")

	c.JSON(http.StatusOK, gin.H{
		"message": "Patient updated successfully",
		"patient": gin.H{
			"id":             patient.ID,
			"name":           patient.Name,
			"surname":        patient.Surname,
			"dateOfBirth":    patient.DateOfBirth.Format("2006-01-02"),
			"gender":         patient.Gender,
			"bloodType":      patient.BloodType,
			"height":         patient.Height,
			"address":        patient.Address,
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
	log.Printf("Attempting to fetch patient with ID: %s", patientID)

	log.Printf("Attempting to fetch patient details for ID: %s", patientID)

	// Try to find by ID first
	query := initializers.DB.Model(&models.Patient{}).
		Preload("User").
		Where("id = ?", patientID)
	log.Printf("Executing query for ID: %s", patientID)
	err := query.First(&patient).Error

	if err != nil {
		log.Printf("Not found by ID, trying user_id")
		query = initializers.DB.Model(&models.Patient{}).
			Preload("User").
			Where("user_id = ?", patientID)
		log.Printf("Executing query for user_id: %s", patientID)
		if err := query.First(&patient).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
			return
		}

		// Debug log the raw patient data right after fetching
		log.Printf("Raw patient data from DB: %+v", patient)
		log.Printf("Patient.Address value: %q", patient.Address)

		// Double check with a fresh database query
		var checkPatient models.Patient
		if err := initializers.DB.Raw("SELECT * FROM patients WHERE id = ?", patient.ID).Scan(&checkPatient).Error; err != nil {
			log.Printf("Error in verification query: %v", err)
		} else {
			log.Printf("Verification query - Patient.Address: %q", checkPatient.Address)
		}
	}

	// Ensure patient has health metrics
	if err := ensurePatientMetrics(patient.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to ensure health metrics"})
		return
	}

	// Get latest health metrics
	var healthMetrics models.HealthMetrics
	if err := initializers.DB.Where("patient_id = ?", patient.ID).
		Order("date DESC").
		First(&healthMetrics).Error; err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve health metrics"})
		return
	}

	// Log the patient data before sending response
	log.Printf("Patient data before sending response: %+v\n", patient)
	log.Printf("Sending address value: %s\n", patient.Address)

	log.Printf("Raw patient data before response: %+v", patient)
	// Log patient data before serialization
	log.Printf("Patient data before serialization - ID: %d, Address: %q", patient.ID, patient.Address)

	// Create the response data explicitly with all fields
	patientData := gin.H{
		"id":             patient.ID,
		"name":           patient.Name,
		"surname":        patient.Surname,
		"dateOfBirth":    patient.DateOfBirth.Format("2006-01-02"),
		"gender":         patient.Gender,
		"bloodType":      patient.BloodType,
		"height":         patient.Height,
		"address":        patient.Address, // Explicitly include address
		"medicalRecord":  patient.MedicalRecord,
		"medicalHistory": patient.MedicalHistory,
		"allergies":      patient.Allergies,
		"medications":    patient.Medications,
	}

	// Log the serialized patient data
	log.Printf("Serialized patient data: %+v", patientData)

	// Update patientData to include emergencyContact and healthMetrics
	patientData["emergencyContact"] = gin.H{
		"name":         patient.EmergencyContact.Name,
		"relationship": patient.EmergencyContact.Relationship,
		"phoneNumber":  patient.EmergencyContact.PhoneNumber,
	}
	patientData["healthMetrics"] = gin.H{
		"weight":        healthMetrics.Weight,
		"heartRate":     healthMetrics.HeartRate,
		"bloodPressure": healthMetrics.BloodPressure,
		"lastCheckup":   healthMetrics.Date.Format("2006-01-02"),
	}

	log.Printf("Final patient data: %+v", patientData)

	// Create final response
	responseData := gin.H{
		"patient": patientData,
	}

	log.Printf("Final response: %+v", responseData)
	c.JSON(http.StatusOK, responseData)
}

// CheckPatientDetails checks if a patient record exists for a given user ID
func CheckPatientDetails(c *gin.Context) {
	userID := c.Param("userId")

	var patient models.Patient
	result := initializers.DB.Where("user_id = ?", userID).First(&patient)

	if result.Error != nil {
		c.JSON(http.StatusOK, gin.H{
			"exists": false,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"exists":    true,
		"patientId": patient.ID,
	})
}

// GetPatientHealthMetrics handles the API requests for patient health metrics
func GetPatientHealthMetrics(c *gin.Context) {
	// Get patient ID from URL parameter
	patientIDParam := c.Param("patientId")
	
	// Check if patient exists
	var patient models.Patient
	log.Printf("Attempting to fetch patient health metrics for ID: %s", patientIDParam)

	// Try to find by ID first
	err := initializers.DB.First(&patient, patientIDParam).Error
	if err != nil {
		log.Printf("Not found by ID, trying user_id for health metrics")
		// If not found by ID, try by user_id
		if err := initializers.DB.Where("user_id = ?", patientIDParam).First(&patient).Error; err != nil {
			c.JSON(http.StatusNotFound, gin.H{"error": "Patient not found"})
			return
		}
	}

	log.Printf("Found patient for health metrics - ID: %d, UserID: %d", patient.ID, patient.UserID)

	// Ensure patient has health metrics
	if err := ensurePatientMetrics(patient.ID); err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to ensure health metrics"})
		return
	}

	// Get the last 30 days of metrics
	var metrics []models.HealthMetrics
	thirtyDaysAgo := time.Now().AddDate(0, 0, -30).Truncate(24 * time.Hour)
	result := initializers.DB.Where("patient_id = ? AND date >= ?", patient.ID, thirtyDaysAgo).
		Order("date ASC").
		Find(&metrics)

	if result.Error != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Error retrieving metrics"})
		return
	}

	c.JSON(http.StatusOK, metrics)
}
