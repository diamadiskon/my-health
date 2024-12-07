package models

import (
	"gorm.io/gorm"
)

type Invitation struct {
	gorm.Model
	AdminID     uint      `gorm:"not null"`
	Admin       User      `gorm:"foreignKey:AdminID"`
	PatientID   uint      `gorm:"not null"`
	Patient     User      `gorm:"foreignKey:PatientID"`
	HouseholdID uint      `gorm:"not null"`
	Household   Household `json:"household" gorm:"foreignKey:HouseholdID"`
	Status      string
}
