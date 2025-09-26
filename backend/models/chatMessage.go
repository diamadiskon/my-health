package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChatMessage struct {
	gorm.Model
	SessionID     uuid.UUID `json:"session_id" gorm:"type:uuid;not null"`
	Role          string    `json:"role" gorm:"not null"`          // 'user' or 'assistant'
	Content       string    `json:"content" gorm:"type:text;not null"`
	TokensUsed    int       `json:"tokens_used" gorm:"default:0"`
	ResponseTime  int       `json:"response_time" gorm:"default:0"` // in milliseconds
	IsEncrypted   bool      `json:"is_encrypted" gorm:"default:false"`
	MessageIndex  int       `json:"message_index"`                  // Order in conversation
	Timestamp     time.Time `json:"timestamp" gorm:"default:CURRENT_TIMESTAMP"`
}

// BeforeCreate will set the timestamp and message index
func (cm *ChatMessage) BeforeCreate(tx *gorm.DB) error {
	if cm.Timestamp.IsZero() {
		cm.Timestamp = time.Now()
	}

	// Set message index based on existing messages in session
	var count int64
	tx.Model(&ChatMessage{}).Where("session_id = ?", cm.SessionID).Count(&count)
	cm.MessageIndex = int(count) + 1

	return nil
}

// IsUserMessage checks if the message is from user
func (cm *ChatMessage) IsUserMessage() bool {
	return cm.Role == "user"
}

// IsAssistantMessage checks if the message is from AI assistant
func (cm *ChatMessage) IsAssistantMessage() bool {
	return cm.Role == "assistant"
}