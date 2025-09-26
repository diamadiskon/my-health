package ai

import (
	"bytes"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"os"
	"time"
)

type OllamaClient struct {
	BaseURL string
	Client  *http.Client
}

type OllamaRequest struct {
	Model  string `json:"model"`
	Prompt string `json:"prompt"`
	Stream bool   `json:"stream"`
}

type OllamaResponse struct {
	Response string `json:"response"`
	Done     bool   `json:"done"`
	Model    string `json:"model"`
}

func NewOllamaClient() *OllamaClient {
	// Get Ollama URL from environment variable, fallback to localhost for development
	ollamaURL := os.Getenv("OLLAMA_URL")
	if ollamaURL == "" {
		ollamaURL = "http://localhost:11434" // Default for local development
	}

	return &OllamaClient{
		BaseURL: ollamaURL,
		Client: &http.Client{
			Timeout: 60 * time.Second, // 60 second timeout for AI responses
		},
	}
}

func (oc *OllamaClient) GenerateResponse(model, prompt string) (*OllamaResponse, error) {
	reqBody := OllamaRequest{
		Model:  model,
		Prompt: prompt,
		Stream: false,
	}

	jsonData, err := json.Marshal(reqBody)
	if err != nil {
		return nil, fmt.Errorf("failed to marshal request: %v", err)
	}

	resp, err := oc.Client.Post(
		fmt.Sprintf("%s/api/generate", oc.BaseURL),
		"application/json",
		bytes.NewBuffer(jsonData),
	)
	if err != nil {
		return nil, fmt.Errorf("failed to call Ollama API: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("Ollama API error (status %d): %s", resp.StatusCode, string(body))
	}

	var ollamaResp OllamaResponse
	if err := json.NewDecoder(resp.Body).Decode(&ollamaResp); err != nil {
		return nil, fmt.Errorf("failed to decode Ollama response: %v", err)
	}

	return &ollamaResp, nil
}

func (oc *OllamaClient) IsHealthy() error {
	resp, err := oc.Client.Get(fmt.Sprintf("%s/api/tags", oc.BaseURL))
	if err != nil {
		return fmt.Errorf("Ollama service unreachable: %v", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return fmt.Errorf("Ollama service unhealthy (status %d)", resp.StatusCode)
	}

	return nil
}