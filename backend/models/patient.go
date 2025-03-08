package models

import (
	"time"

	"gorm.io/gorm"
)

type EmergencyContact struct {
	Name         string `json:"name" gorm:"column:emergency_contact_name"`
	Relationship string `json:"relationship" gorm:"column:emergency_contact_relationship"`
	PhoneNumber  string `json:"phone_number" gorm:"column:emergency_contact_phone_number"`
}

type Patient struct {
	gorm.Model
	UserID        uint      `json:"user_id" gorm:"uniqueIndex"`
	User          User      `json:"user" gorm:"foreignKey:UserID"`
	Name          string    `json:"name"`
	Surname       string    `json:"surname"`
	Address       string    `json:"address"`
	MedicalRecord string    `json:"medical_record"`
	DateOfBirth   time.Time `json:"date_of_birth"`

	Gender           string           `json:"gender"`
	BloodType        string           `json:"blood_type"`
	Height           float64          `json:"height"`
	MedicalHistory   string           `json:"medical_history"`
	Allergies        string           `json:"allergies"`
	Medications      string           `json:"medications"`
	EmergencyContact EmergencyContact `json:"emergency_contact" gorm:"embedded;embeddedPrefix:emergency_contact_"`
	Households       []Household      `json:"households" gorm:"many2many:household_patients;"`
	HealthMetrics    []HealthMetrics  `json:"health_metrics" gorm:"foreignKey:PatientID"`
}

func (p *Patient) Age() int {
	return int(time.Since(p.DateOfBirth).Hours() / 24 / 365)
}
