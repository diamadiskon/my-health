package models

import (
	"time"

	"gorm.io/gorm"
)

type HealthMetrics struct {
	gorm.Model
	PatientID        uint      `json:"patient_id"`
	Date             time.Time `json:"date" gorm:"not null;default:CURRENT_TIMESTAMP"`
	Height           float64   `json:"height"`
	Weight           float64   `json:"weight"`
	HeartRate        int       `json:"heart_rate"`
	SystolicBP       int       `json:"systolic_bp"`
	DiastolicBP      int       `json:"diastolic_bp"`
	OxygenSaturation float64   `json:"oxygen_saturation"`
	BloodPressure    string    `json:"blood_pressure"`
}

// BeforeCreate will set the Date field to current time if not set
func (h *HealthMetrics) BeforeCreate(tx *gorm.DB) error {
	if h.Date.IsZero() {
		h.Date = time.Now()
	}
	return nil
}
