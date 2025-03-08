package models

import (
	"time"

	"gorm.io/gorm"
)

type SleepStages struct {
	Light     float64 `json:"light"`
	Deep      float64 `json:"deep"`
	REM       float64 `json:"rem"`
	AwakeTime int     `json:"awake_time"` // in minutes
}

type HealthMetrics struct {
	gorm.Model
	PatientID        uint        `json:"patient_id"`
	Date             time.Time   `json:"date" gorm:"not null;default:CURRENT_TIMESTAMP"`
	Weight           float64     `json:"weight"`
	HeartRate        int         `json:"heart_rate"`
	SystolicBP       int         `json:"systolic_bp"`
	DiastolicBP      int         `json:"diastolic_bp"`
	OxygenSaturation float64     `json:"oxygen_saturation"`
	BloodPressure    string      `json:"blood_pressure"`
	StepsCount       int         `json:"steps_count"`
	Sleep            SleepStages `json:"sleep" gorm:"embedded"`
	SleepDuration    float64     `json:"sleep_duration"` // in hours
	IrregularRhythm  bool        `json:"irregular_rhythm"`
	FallDetected     bool        `json:"fall_detected"`
}

// BeforeCreate will set the Date field to current time if not set
func (h *HealthMetrics) BeforeCreate(tx *gorm.DB) error {
	if h.Date.IsZero() {
		h.Date = time.Now()
	}
	return nil
}
