#!/bin/bash

# Ollama Setup Script for My-Health Application
# This script sets up Ollama with a healthcare-optimized model

set -e  # Exit on any error

echo "🤖 Setting up Ollama for My-Health AI Chatbot..."

# Check if Docker is running
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

# Start Ollama service
echo "🐳 Starting Ollama container..."
docker-compose up -d ollama

# Wait for Ollama to be ready
echo "⏳ Waiting for Ollama to start..."
for i in {1..30}; do
    if curl -s http://localhost:11434/api/tags >/dev/null 2>&1; then
        echo "✅ Ollama is ready!"
        break
    fi
    if [ $i -eq 30 ]; then
        echo "❌ Ollama failed to start after 30 attempts"
        docker-compose logs ollama
        exit 1
    fi
    sleep 2
done

# Download the healthcare-optimized model
echo "📥 Downloading Llama 2 7B Chat model (this may take several minutes)..."
docker exec my-health-ollama ollama pull llama2:7b-chat

# Test the model
echo "🧪 Testing the AI model..."
RESPONSE=$(docker exec my-health-ollama ollama run llama2:7b-chat "What is blood pressure? Keep it simple." --format json 2>/dev/null || echo "")

if [ -n "$RESPONSE" ]; then
    echo "✅ Model test successful!"
    echo "📊 Sample response preview:"
    echo "$RESPONSE" | head -3
else
    echo "⚠️  Model downloaded but test failed. The model should still work."
fi

# Create a healthcare-specific modelfile for optimization
echo "⚙️  Creating healthcare-optimized model configuration..."
cat > /tmp/healthbot.modelfile << 'EOF'
FROM llama2:7b-chat

TEMPLATE """{{ if .System }}{{ .System }}{{ end }}{{ if .Prompt }}

### Human: {{ .Prompt }}{{ end }}

### Assistant: {{ .Response }}"""

SYSTEM """You are a helpful AI assistant for an elderly health monitoring system. You provide informational health responses and always recommend consulting healthcare providers for medical advice. Keep responses clear, simple, and appropriate for elderly users. Never provide medical diagnosis or treatment recommendations."""

PARAMETER temperature 0.3
PARAMETER top_p 0.9
PARAMETER repeat_penalty 1.1
PARAMETER top_k 40
PARAMETER num_ctx 4096
EOF

# Create the optimized model
echo "🏥 Creating healthcare-optimized model..."
docker cp /tmp/healthbot.modelfile my-health-ollama:/tmp/healthbot.modelfile
docker exec my-health-ollama ollama create healthbot -f /tmp/healthbot.modelfile

# Clean up temporary file
rm /tmp/healthbot.modelfile

# Test the optimized model
echo "🧪 Testing healthcare-optimized model..."
HEALTH_RESPONSE=$(docker exec my-health-ollama ollama run healthbot "Explain what heart rate means for elderly patients" 2>/dev/null || echo "")

if [ -n "$HEALTH_RESPONSE" ]; then
    echo "✅ Healthcare model ready!"
    echo "📋 Sample healthcare response:"
    echo "$HEALTH_RESPONSE" | head -5
fi

# Show available models
echo "📚 Available models:"
docker exec my-health-ollama ollama list

# Display connection information
echo ""
echo "🎉 Ollama setup complete!"
echo ""
echo "📡 Connection Details:"
echo "   • Ollama API: http://localhost:11434"
echo "   • Health Model: healthbot"
echo "   • Backup Model: llama2:7b-chat"
echo ""
echo "🧪 Quick API Test:"
echo 'curl -X POST http://localhost:11434/api/generate \'
echo '  -H "Content-Type: application/json" \'
echo '  -d '\''{"model": "healthbot", "prompt": "What is blood pressure?", "stream": false}'\'''
echo ""
echo "📝 Next Steps:"
echo "   1. The Ollama service is now running"
echo "   2. Use 'healthbot' model for healthcare queries"
echo "   3. Implement the Go backend AI service"
echo "   4. Add the React chat frontend component"
echo ""
echo "💡 Useful Commands:"
echo "   • View logs: docker-compose logs ollama"
echo "   • Restart: docker-compose restart ollama"
echo "   • Stop: docker-compose stop ollama"
echo "   • Test API: curl http://localhost:11434/api/tags"

echo ""
echo "✨ Ollama AI is ready for your My-Health application!"