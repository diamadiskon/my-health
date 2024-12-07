package models

import "gorm.io/gorm"

type Household struct {
	gorm.Model
	AdminID  uint      `json:"admin_id" gorm:"not null"`
	Admin    User      `json:"admin" gorm:"foreignKey:AdminID"`
	Patients []Patient `json:"patients" gorm:"many2many:household_patients;"`
}
