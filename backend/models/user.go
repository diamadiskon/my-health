package models

import (
	"time"

	"gorm.io/gorm"
)

type User struct {
	gorm.Model
	Username      string      `json:"username" gorm:"uniqueIndex"`
	Password      string      `json:"-"` // "-" means this won't be included in JSON
	Role          string      `json:"role"`
	IsInHousehold bool        `json:"is_in_household"`
	Households    []Household `json:"households" gorm:"many2many:household_patients;"`
	Patient       *Patient    `json:"patient,omitempty"`
	CreatedAt     time.Time
	UpdatedAt     time.Time
}

// Add any methods specific to User here
func (u *User) IsPatient() bool {
	return u.Role == "patient"
}
