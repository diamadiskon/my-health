package controllers

import (
	"my-health/models"
	"my-health/services/ai"
	"net/http"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ChatController struct {
	chatService *ai.ChatService
}

func NewChatController() *ChatController {
	return &ChatController{
		chatService: ai.NewChatService(),
	}
}

type ChatMessageRequest struct {
	Message string `json:"message" binding:"required"`
}

// SendMessage handles POST /api/ai/chat
func (cc *ChatController) SendMessage(c *gin.Context) {
	// Get user from JWT token (set by auth middleware)
	userInterface, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	user, ok := userInterface.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user data"})
		return
	}

	var req ChatMessageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid request format", "details": err.Error()})
		return
	}

	// Validate message length
	if len(req.Message) > 1000 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message too long. Maximum 1000 characters allowed."})
		return
	}

	if len(req.Message) < 1 {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Message cannot be empty."})
		return
	}

	// Create chat request
	chatReq := ai.ChatRequest{
		UserID:  user.ID,
		Message: req.Message,
	}

	// Process message through AI service
	response, err := cc.chatService.ProcessMessage(chatReq)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to process message",
			"details": err.Error(),
		})
		return
	}

	if !response.Success {
		c.JSON(http.StatusServiceUnavailable, gin.H{
			"error": response.Error,
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"response":      response.Response,
		"session_id":    response.SessionID,
		"response_time": response.ResponseTime,
		"tokens_used":   response.TokensUsed,
		"success":       true,
	})
}

// GetHistory handles GET /api/ai/history
func (cc *ChatController) GetHistory(c *gin.Context) {
	// Get user from JWT token (set by auth middleware)
	userInterface, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	user, ok := userInterface.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user data"})
		return
	}

	// Get optional limit parameter
	limitStr := c.DefaultQuery("limit", "50")
	limit, err := strconv.Atoi(limitStr)
	if err != nil || limit < 0 {
		limit = 50
	}

	// Get conversation history
	history, err := cc.chatService.GetConversationHistory(user.ID, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to retrieve conversation history",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"session_id": history.SessionID,
		"messages":   history.Messages,
		"user_id":    history.UserID,
		"success":    true,
	})
}

// ClearHistory handles DELETE /api/ai/clear
func (cc *ChatController) ClearHistory(c *gin.Context) {
	// Get user from JWT token (set by auth middleware)
	userInterface, exists := c.Get("currentUser")
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"error": "Authentication required"})
		return
	}

	user, ok := userInterface.(models.User)
	if !ok {
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Invalid user data"})
		return
	}

	// Clear conversation history
	err := cc.chatService.ClearConversation(user.ID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{
			"error":   "Failed to clear conversation history",
			"details": err.Error(),
		})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"message": "Conversation history cleared successfully",
		"success": true,
	})
}

// GetStatus handles GET /api/ai/status
func (cc *ChatController) GetStatus(c *gin.Context) {
	// Check if Ollama service is healthy
	ollamaClient := ai.NewOllamaClient()
	err := ollamaClient.IsHealthy()

	status := gin.H{
		"ai_service_healthy": err == nil,
		"timestamp":          c.Request.Header.Get("X-Request-Time"),
	}

	if err != nil {
		status["error"] = err.Error()
		c.JSON(http.StatusServiceUnavailable, status)
		return
	}

	c.JSON(http.StatusOK, status)
}