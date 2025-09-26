package ai

import (
	"encoding/json"
	"fmt"
	"my-health/initializers"
	"my-health/models"
	"strings"
)

type UserContext struct {
	UserID       uint   `json:"user_id"`
	UserRole     string `json:"user_role"`
	UserName     string `json:"user_name"`
	IsPatient    bool   `json:"is_patient"`
	PatientData  *PatientContextData `json:"patient_data,omitempty"`
	AdminData    *AdminContextData   `json:"admin_data,omitempty"`
}

type PatientContextData struct {
	Name             string  `json:"name"`
	Age              int     `json:"age"`
	Gender           string  `json:"gender"`
	BloodType        string  `json:"blood_type"`
	Height           float64 `json:"height"`
	Medications      string  `json:"medications"`
	Allergies        string  `json:"allergies"`
	MedicalHistory   string  `json:"medical_history"`
	EmergencyContact models.EmergencyContact `json:"emergency_contact"`
	LatestMetrics    *models.HealthMetrics   `json:"latest_metrics,omitempty"`
}

type AdminContextData struct {
	PatientCount    int             `json:"patient_count"`
	Patients        []PatientSummary `json:"patients"`
	HouseholdInfo   string          `json:"household_info"`
}

type PatientSummary struct {
	Name           string                 `json:"name"`
	Age            int                    `json:"age"`
	Gender         string                 `json:"gender"`
	BloodType      string                 `json:"blood_type"`
	Height         float64                `json:"height"`
	Medications    string                 `json:"medications,omitempty"`
	Allergies      string                 `json:"allergies,omitempty"`
	LatestMetrics  *models.HealthMetrics  `json:"latest_metrics,omitempty"`
}

func BuildUserContext(userID uint) (*UserContext, error) {
	var user models.User
	if err := initializers.DB.Preload("Patient").First(&user, userID).Error; err != nil {
		return nil, fmt.Errorf("failed to get user: %v", err)
	}

	context := &UserContext{
		UserID:    user.ID,
		UserRole:  user.Role,
		UserName:  user.Username,
		IsPatient: user.IsPatient(),
	}

	if user.IsPatient() && user.Patient != nil {
		patientContext, err := buildPatientContext(user.Patient)
		if err != nil {
			return nil, err
		}
		context.PatientData = patientContext
	} else {
		adminContext, err := buildAdminContext(userID)
		if err != nil {
			return nil, err
		}
		context.AdminData = adminContext
	}

	return context, nil
}

func buildPatientContext(patient *models.Patient) (*PatientContextData, error) {
	// Get latest health metrics
	var latestMetrics models.HealthMetrics
	err := initializers.DB.Where("patient_id = ?", patient.ID).
		Order("date DESC").
		First(&latestMetrics).Error

	var metricsPtr *models.HealthMetrics
	if err == nil {
		metricsPtr = &latestMetrics
	}

	return &PatientContextData{
		Name:             fmt.Sprintf("%s %s", patient.Name, patient.Surname),
		Age:              patient.Age(),
		Gender:           patient.Gender,
		BloodType:        patient.BloodType,
		Height:           patient.Height,
		Medications:      patient.Medications,
		Allergies:        patient.Allergies,
		MedicalHistory:   patient.MedicalHistory,
		EmergencyContact: patient.EmergencyContact,
		LatestMetrics:    metricsPtr,
	}, nil
}

func buildAdminContext(userID uint) (*AdminContextData, error) {
	// Get households managed by this admin
	var households []models.Household
	if err := initializers.DB.Preload("Patients").Where("admin_id = ?", userID).Find(&households).Error; err != nil {
		return nil, fmt.Errorf("failed to get households: %v", err)
	}

	var patients []PatientSummary
	patientCount := 0

	for _, household := range households {
		for _, patient := range household.Patients {
			// Get latest health metrics for each patient
			var latestMetrics models.HealthMetrics
			err := initializers.DB.Where("patient_id = ?", patient.ID).
				Order("date DESC").
				First(&latestMetrics).Error

			var metricsPtr *models.HealthMetrics
			if err == nil {
				metricsPtr = &latestMetrics
			}

			patientSummary := PatientSummary{
				Name:          fmt.Sprintf("%s %s", patient.Name, patient.Surname),
				Age:           patient.Age(),
				Gender:        patient.Gender,
				BloodType:     patient.BloodType,
				Height:        patient.Height,
				Medications:   patient.Medications,
				Allergies:     patient.Allergies,
				LatestMetrics: metricsPtr,
			}

			patients = append(patients, patientSummary)
			patientCount++
		}
	}

	householdInfo := fmt.Sprintf("Managing %d household(s) with %d patient(s)", len(households), patientCount)

	return &AdminContextData{
		PatientCount:  patientCount,
		Patients:      patients,
		HouseholdInfo: householdInfo,
	}, nil
}

func GenerateHealthcarePrompt(context *UserContext, userMessage string) string {
	var prompt strings.Builder

	prompt.WriteString("You are a helpful AI assistant for an elderly health monitoring system. ")
	prompt.WriteString("You provide informational health responses and always recommend consulting healthcare providers for medical advice. ")
	prompt.WriteString("Keep responses clear, simple, and appropriate for elderly users. ")
	prompt.WriteString("Never provide medical diagnosis or treatment recommendations.\n\n")

	if context.IsPatient && context.PatientData != nil {
		prompt.WriteString(fmt.Sprintf("Current User: %s (Patient)\n", context.PatientData.Name))
		prompt.WriteString("Your Health Information:\n")
		prompt.WriteString(fmt.Sprintf("- Age: %d years old\n", context.PatientData.Age))
		prompt.WriteString(fmt.Sprintf("- Gender: %s\n", context.PatientData.Gender))
		prompt.WriteString(fmt.Sprintf("- Blood Type: %s\n", context.PatientData.BloodType))
		prompt.WriteString(fmt.Sprintf("- Height: %.1f cm\n", context.PatientData.Height))

		if context.PatientData.Medications != "" {
			prompt.WriteString(fmt.Sprintf("- Current Medications: %s\n", context.PatientData.Medications))
		}

		if context.PatientData.Allergies != "" {
			prompt.WriteString(fmt.Sprintf("- Known Allergies: %s\n", context.PatientData.Allergies))
		}

		if context.PatientData.LatestMetrics != nil {
			metrics := context.PatientData.LatestMetrics
			prompt.WriteString("- Latest Vital Signs:\n")
			prompt.WriteString(fmt.Sprintf("  • Blood Pressure: %d/%d mmHg\n", metrics.SystolicBP, metrics.DiastolicBP))
			prompt.WriteString(fmt.Sprintf("  • Heart Rate: %d bpm\n", metrics.HeartRate))
			prompt.WriteString(fmt.Sprintf("  • Weight: %.1f kg\n", metrics.Weight))
			prompt.WriteString(fmt.Sprintf("  • Oxygen Saturation: %.1f%%\n", metrics.OxygenSaturation))
			if metrics.StepsCount > 0 {
				prompt.WriteString(fmt.Sprintf("  • Daily Steps: %d\n", metrics.StepsCount))
			}
		}

		prompt.WriteString("\nPlease answer questions about YOUR health data only. Do not provide medical diagnosis or treatment advice. ")
		prompt.WriteString("Suggest consulting with healthcare providers for medical concerns.\n\n")
	} else if context.AdminData != nil {
		prompt.WriteString(fmt.Sprintf("Current User: %s (Admin/Caregiver)\n", context.UserName))
		prompt.WriteString("You are assisting a caregiver/admin who manages multiple patients.\n")
		prompt.WriteString(fmt.Sprintf("Household Information: %s\n", context.AdminData.HouseholdInfo))

		if len(context.AdminData.Patients) > 0 {
			prompt.WriteString("Patients under your care:\n")
			for _, patient := range context.AdminData.Patients {
				prompt.WriteString(fmt.Sprintf("\n• %s (Age: %d, Gender: %s)\n", patient.Name, patient.Age, patient.Gender))
				prompt.WriteString(fmt.Sprintf("  - Blood Type: %s, Height: %.1f cm\n", patient.BloodType, patient.Height))
				
				if patient.Medications != "" {
					prompt.WriteString(fmt.Sprintf("  - Medications: %s\n", patient.Medications))
				}
				
				if patient.Allergies != "" {
					prompt.WriteString(fmt.Sprintf("  - Allergies: %s\n", patient.Allergies))
				}
				
				if patient.LatestMetrics != nil {
					metrics := patient.LatestMetrics
					prompt.WriteString("  - Latest Vital Signs:\n")
					prompt.WriteString(fmt.Sprintf("    • Blood Pressure: %d/%d mmHg\n", metrics.SystolicBP, metrics.DiastolicBP))
					prompt.WriteString(fmt.Sprintf("    • Heart Rate: %d bpm\n", metrics.HeartRate))
					prompt.WriteString(fmt.Sprintf("    • Weight: %.1f kg\n", metrics.Weight))
					prompt.WriteString(fmt.Sprintf("    • Oxygen Saturation: %.1f%%\n", metrics.OxygenSaturation))
					if metrics.StepsCount > 0 {
						prompt.WriteString(fmt.Sprintf("    • Daily Steps: %d\n", metrics.StepsCount))
					}
				}
			}
		}

		prompt.WriteString("\nYou have access to detailed information about each patient including their current vital signs, medications, and health metrics. ")
		prompt.WriteString("You can answer specific questions about any of these patients' health data. ")
		prompt.WriteString("When referring to patient data, use the specific names and current information provided above.\n\n")
	}

	prompt.WriteString(fmt.Sprintf("User Question: %s\n", userMessage))
	prompt.WriteString("AI Response:")

	return prompt.String()
}

func SerializeContext(context *UserContext) (string, error) {
	jsonData, err := json.Marshal(context)
	if err != nil {
		return "", fmt.Errorf("failed to serialize context: %v", err)
	}
	return string(jsonData), nil
}