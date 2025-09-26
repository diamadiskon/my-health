package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChatSession struct {
	gorm.Model
	UserID      uint      `json:"user_id" gorm:"not null"`
	User        User      `json:"user" gorm:"foreignKey:UserID"`
	SessionID   uuid.UUID `json:"session_id" gorm:"type:uuid;default:gen_random_uuid();uniqueIndex"`
	SessionType string    `json:"session_type" gorm:"default:'general'"` // 'patient' or 'admin'
	ContextData string    `json:"context_data" gorm:"type:text"`          // JSON string of user's health context
	IsActive    bool      `json:"is_active" gorm:"default:true"`
	LastUsedAt  time.Time `json:"last_used_at"`
	Messages    []ChatMessage `json:"messages" gorm:"foreignKey:SessionID;references:SessionID"`
}

// BeforeCreate will set the SessionID and LastUsedAt if not set
func (cs *ChatSession) BeforeCreate(tx *gorm.DB) error {
	if cs.SessionID == uuid.Nil {
		cs.SessionID = uuid.New()
	}
	if cs.LastUsedAt.IsZero() {
		cs.LastUsedAt = time.Now()
	}
	// Set session type based on user role
	if cs.User.Role == "patient" {
		cs.SessionType = "patient"
	} else if cs.User.Role == "admin" {
		cs.SessionType = "admin"
	}
	return nil
}

// UpdateLastUsed updates the last used timestamp
func (cs *ChatSession) UpdateLastUsed(db *gorm.DB) error {
	cs.LastUsedAt = time.Now()
	return db.Save(cs).Error
}