package models

import (
	"time"

	"gorm.io/gorm"
)

type HealthMetrics struct {
	gorm.Model
	PatientID        uint      `json:"patient_id"`
	Date             time.Time `json:"date"`
	HeartRate        int       `json:"heart_rate"`
	SystolicBP       int       `json:"systolic_bp"`
	DiastolicBP      int       `json:"diastolic_bp"`
	OxygenSaturation float64   `json:"oxygen_saturation"`
	BloodPressure    string    `json:"blood_pressure"`
}
