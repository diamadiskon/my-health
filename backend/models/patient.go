package models

import (
	"time"

	"gorm.io/gorm"
)

type Patient struct {
	gorm.Model
	UserID        uint      `json:"user_id" gorm:"uniqueIndex"`
	User          User      `json:"user" gorm:"foreignKey:UserID"`
	Name          string    `json:"name"`
	Surname       string    `json:"surname"`
	Address       string    `json:"address"`
	MedicalRecord string    `json:"medical_record"`
	DateOfBirth   time.Time `json:"date_of_birth"`

	Gender           string `json:"gender"`
	BloodType        string `json:"blood_type"`
	MedicalHistory   string `json:"medical_history"`
	Allergies        string `json:"allergies"`
	Medications      string `json:"medications"`
	EmergencyContact struct {
		Name         string `json:"name"`
		Relationship string `json:"relationship"`
		PhoneNumber  string `json:"phone_number"`
	} `json:"emergency_contact" gorm:"embedded"`
	Households    []Household     `json:"households" gorm:"many2many:household_patients;"`
	HealthMetrics []HealthMetrics `json:"health_metrics" gorm:"foreignKey:PatientID"`
}

func (p *Patient) Age() int {
	return int(time.Since(p.DateOfBirth).Hours() / 24 / 365)
}
