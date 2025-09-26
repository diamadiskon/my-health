package ai

import (
	"fmt"
	"my-health/initializers"
	"my-health/models"
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type ChatService struct {
	ollamaClient *OllamaClient
}

type ChatRequest struct {
	UserID  uint   `json:"user_id"`
	Message string `json:"message"`
}

type ChatResponse struct {
	Response     string            `json:"response"`
	SessionID    uuid.UUID         `json:"session_id"`
	ResponseTime int               `json:"response_time"` // in milliseconds
	TokensUsed   int               `json:"tokens_used"`
	Success      bool              `json:"success"`
	Error        string            `json:"error,omitempty"`
}

type ConversationHistory struct {
	SessionID uuid.UUID            `json:"session_id"`
	Messages  []models.ChatMessage `json:"messages"`
	UserID    uint                 `json:"user_id"`
}

func NewChatService() *ChatService {
	return &ChatService{
		ollamaClient: NewOllamaClient(),
	}
}

func (cs *ChatService) ProcessMessage(req ChatRequest) (*ChatResponse, error) {
	startTime := time.Now()

	// Check if Ollama is healthy
	if err := cs.ollamaClient.IsHealthy(); err != nil {
		return &ChatResponse{
			Success: false,
			Error:   "AI service is currently unavailable. Please try again later.",
		}, err
	}

	// Get or create chat session
	session, err := cs.getOrCreateSession(req.UserID)
	if err != nil {
		return &ChatResponse{
			Success: false,
			Error:   "Failed to initialize chat session.",
		}, err
	}

	// Build user context
	context, err := BuildUserContext(req.UserID)
	if err != nil {
		return &ChatResponse{
			Success: false,
			Error:   "Failed to load user context.",
		}, err
	}

	// Generate healthcare-specific prompt
	prompt := GenerateHealthcarePrompt(context, req.Message)

	// Save user message
	userMessage := models.ChatMessage{
		SessionID: session.SessionID,
		Role:      "user",
		Content:   req.Message,
	}
	if err := initializers.DB.Create(&userMessage).Error; err != nil {
		return &ChatResponse{
			Success: false,
			Error:   "Failed to save your message.",
		}, err
	}

	// Call Ollama API
	ollamaResp, err := cs.ollamaClient.GenerateResponse("healthbot", prompt)
	if err != nil {
		// Save error message
		errorMessage := models.ChatMessage{
			SessionID: session.SessionID,
			Role:      "assistant",
			Content:   "I'm having trouble processing your request right now. Please try again in a few moments.",
		}
		initializers.DB.Create(&errorMessage)

		return &ChatResponse{
			Success: false,
			Error:   "AI service is temporarily unavailable.",
		}, err
	}

	responseTime := int(time.Since(startTime).Milliseconds())

	// Save assistant response
	assistantMessage := models.ChatMessage{
		SessionID:    session.SessionID,
		Role:         "assistant",
		Content:      ollamaResp.Response,
		ResponseTime: responseTime,
		TokensUsed:   len(ollamaResp.Response) / 4, // Rough token estimation
	}
	if err := initializers.DB.Create(&assistantMessage).Error; err != nil {
		return &ChatResponse{
			Success: false,
			Error:   "Failed to save AI response.",
		}, err
	}

	// Update session last used time
	session.UpdateLastUsed(initializers.DB)

	return &ChatResponse{
		Response:     ollamaResp.Response,
		SessionID:    session.SessionID,
		ResponseTime: responseTime,
		TokensUsed:   assistantMessage.TokensUsed,
		Success:      true,
	}, nil
}

func (cs *ChatService) GetConversationHistory(userID uint, limit int) (*ConversationHistory, error) {
	// Get user's active session
	var session models.ChatSession
	err := initializers.DB.Where("user_id = ? AND is_active = ?", userID, true).
		Order("last_used_at DESC").
		First(&session).Error
	if err != nil {
		if err == gorm.ErrRecordNotFound {
			// No active session, return empty history
			return &ConversationHistory{
				Messages: []models.ChatMessage{},
				UserID:   userID,
			}, nil
		}
		return nil, fmt.Errorf("failed to get session: %v", err)
	}

	// Get messages for this session
	var messages []models.ChatMessage
	query := initializers.DB.Where("session_id = ?", session.SessionID).
		Order("message_index ASC")

	if limit > 0 {
		query = query.Limit(limit)
	}

	if err := query.Find(&messages).Error; err != nil {
		return nil, fmt.Errorf("failed to get messages: %v", err)
	}

	return &ConversationHistory{
		SessionID: session.SessionID,
		Messages:  messages,
		UserID:    userID,
	}, nil
}

func (cs *ChatService) ClearConversation(userID uint) error {
	// Get user's active sessions
	var sessions []models.ChatSession
	if err := initializers.DB.Where("user_id = ?", userID).Find(&sessions).Error; err != nil {
		return fmt.Errorf("failed to get sessions: %v", err)
	}

	// Delete all messages for these sessions
	for _, session := range sessions {
		if err := initializers.DB.Where("session_id = ?", session.SessionID).Delete(&models.ChatMessage{}).Error; err != nil {
			return fmt.Errorf("failed to delete messages: %v", err)
		}
	}

	// Delete sessions
	if err := initializers.DB.Where("user_id = ?", userID).Delete(&models.ChatSession{}).Error; err != nil {
		return fmt.Errorf("failed to delete sessions: %v", err)
	}

	return nil
}

func (cs *ChatService) getOrCreateSession(userID uint) (*models.ChatSession, error) {
	// Try to get existing active session
	var session models.ChatSession
	err := initializers.DB.Where("user_id = ? AND is_active = ?", userID, true).
		Preload("User").
		First(&session).Error

	if err == gorm.ErrRecordNotFound {
		// Create new session
		var user models.User
		if err := initializers.DB.First(&user, userID).Error; err != nil {
			return nil, fmt.Errorf("user not found: %v", err)
		}

		context, err := BuildUserContext(userID)
		if err != nil {
			return nil, fmt.Errorf("failed to build context: %v", err)
		}

		contextData, err := SerializeContext(context)
		if err != nil {
			return nil, fmt.Errorf("failed to serialize context: %v", err)
		}

		session = models.ChatSession{
			UserID:      userID,
			User:        user,
			SessionID:   uuid.New(),
			SessionType: user.Role,
			ContextData: contextData,
			IsActive:    true,
			LastUsedAt:  time.Now(),
		}

		if err := initializers.DB.Create(&session).Error; err != nil {
			return nil, fmt.Errorf("failed to create session: %v", err)
		}

		return &session, nil
	} else if err != nil {
		return nil, fmt.Errorf("failed to get session: %v", err)
	}

	return &session, nil
}