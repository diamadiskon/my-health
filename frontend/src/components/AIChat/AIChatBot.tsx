import React, { useState, useEffect, useRef } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  IconButton,
  Fab,
  Paper,
  List,
  ListItem,
  TextField,
  Button,
  CircularProgress,
  Alert,
  Chip,
} from '@mui/material';
import {
  Close as CloseIcon,
  Send as SendIcon,
  SmartToy as BotIcon,
  Person as PersonIcon,
  DeleteOutline as ClearIcon,
  Refresh as RefreshIcon,
} from '@mui/icons-material';
import axios from 'axios';

interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  response_time?: number;
  tokens_used?: number;
}

interface AIChatBotProps {
  userRole: 'patient' | 'admin';
  userId: string;
  open?: boolean;
  onClose?: () => void;
}

const QUICK_QUESTIONS_PATIENT = [
  "What do my latest vital signs mean?",
  "How is my blood pressure trending?",
  "Should I be concerned about my heart rate?",
  "When should I take my medications?",
  "How can I improve my sleep quality?",
  "What activities are good for my health?",
];

const QUICK_QUESTIONS_ADMIN = [
  "Which patients need attention today?",
  "Are there any concerning vital signs?",
  "Show me recent health trends",
  "What should I monitor for elderly patients?",
  "Generate a health summary",
];

export default function AIChatBot({ userRole, userId, open: controlledOpen, onClose }: AIChatBotProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [aiStatus, setAiStatus] = useState<boolean | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const isOpen = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const handleClose = onClose || (() => setInternalOpen(false));
  const handleOpen = () => {
    if (controlledOpen === undefined) {
      setInternalOpen(true);
    }
  };

  const quickQuestions = userRole === 'patient' ? QUICK_QUESTIONS_PATIENT : QUICK_QUESTIONS_ADMIN;

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Load conversation history when opened
  useEffect(() => {
    if (isOpen) {
      loadHistory();
      checkAIStatus();
    }
  }, [isOpen]);

  const checkAIStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/ai/status', {
        headers: { Authorization: `Bearer ${token}` }
      });
      setAiStatus(response.data.ai_service_healthy);
    } catch (error) {
      console.error('Failed to check AI status:', error);
      setAiStatus(false);
    }
  };

  const loadHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get('http://localhost:8080/api/ai/history?limit=20', {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success && response.data.messages) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error('Failed to load chat history:', error);
    }
  };

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now(),
      role: 'user',
      content: messageText,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);
    setError(null);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post('http://localhost:8080/api/ai/chat',
        { message: messageText },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const aiMessage: ChatMessage = {
          id: Date.now() + 1,
          role: 'assistant',
          content: response.data.response,
          timestamp: new Date().toISOString(),
          response_time: response.data.response_time,
          tokens_used: response.data.tokens_used,
        };

        setMessages(prev => [...prev, aiMessage]);
      } else {
        throw new Error(response.data.error || 'Failed to get AI response');
      }
    } catch (error: any) {
      console.error('Chat error:', error);
      setError(error.response?.data?.error || error.message || 'Failed to send message');

      const errorMessage: ChatMessage = {
        id: Date.now() + 1,
        role: 'assistant',
        content: "I'm having trouble processing your request right now. Please try again in a few moments.",
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsTyping(false);
    }
  };

  const clearHistory = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete('http://localhost:8080/api/ai/clear', {
        headers: { Authorization: `Bearer ${token}` }
      });

      setMessages([]);
      setError(null);
    } catch (error) {
      console.error('Failed to clear history:', error);
      setError('Failed to clear conversation history');
    }
  };

  const handleKeyPress = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      sendMessage(input);
    }
  };

  const formatTimestamp = (timestamp: string) => {
    try {
      return new Date(timestamp).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Floating Chat Button - only show if not controlled */}
      {controlledOpen === undefined && (
        <Fab
          color="secondary"
          onClick={handleOpen}
          sx={{
            position: 'fixed',
            bottom: 24,
            right: 24,
            zIndex: 1000,
            background: 'linear-gradient(45deg, #2196F3 30%, #21CBF3 90%)',
            '&:hover': {
              transform: 'scale(1.1)',
              background: 'linear-gradient(45deg, #1976D2 30%, #0288D1 90%)',
            },
            transition: 'all 0.2s ease-in-out',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': {
              '0%': {
                boxShadow: '0 0 0 0 rgba(33, 150, 243, 0.7)',
              },
              '70%': {
                boxShadow: '0 0 0 10px rgba(33, 150, 243, 0)',
              },
              '100%': {
                boxShadow: '0 0 0 0 rgba(33, 150, 243, 0)',
              },
            },
          }}
        >
          <BotIcon />
        </Fab>
      )}

      {/* Chat Dialog */}
      <Dialog
        open={isOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            height: '80vh',
            maxHeight: '700px',
            minHeight: '500px',
          }
        }}
      >
        <DialogTitle>
          <Box display="flex" justifyContent="space-between" alignItems="center">
            <Box display="flex" alignItems="center" gap={1}>
              <BotIcon sx={{ color: '#2196F3' }} />
              <Typography variant="h6">
                Health Assistant
                {userRole === 'admin' && <Chip label="Caregiver" size="small" sx={{ ml: 1 }} />}
              </Typography>
            </Box>
            <Box display="flex" alignItems="center" gap={1}>
              {aiStatus === false && (
                <Chip
                  label="AI Offline"
                  color="error"
                  size="small"
                  icon={<RefreshIcon />}
                  onClick={checkAIStatus}
                />
              )}
              {aiStatus === true && (
                <Chip
                  label="AI Online"
                  color="success"
                  size="small"
                />
              )}
              <IconButton
                onClick={clearHistory}
                title="Delete conversation history"
                sx={{ color: '#f44336' }}
              >
                <ClearIcon />
              </IconButton>
              <IconButton
                onClick={handleClose}
                title="Close chat window"
                sx={{ color: '#666' }}
              >
                <CloseIcon />
              </IconButton>
            </Box>
          </Box>
        </DialogTitle>

        <DialogContent sx={{ display: 'flex', flexDirection: 'column', padding: 0 }}>
          {/* Error Alert */}
          {error && (
            <Alert
              severity="error"
              onClose={() => setError(null)}
              sx={{ m: 2, mb: 1 }}
            >
              {error}
            </Alert>
          )}

          {/* Quick Questions - show when no messages */}
          {messages.length === 0 && !isTyping && (
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Quick questions to get started:
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mt: 1 }}>
                {quickQuestions.slice(0, 3).map((question, index) => (
                  <Chip
                    key={index}
                    label={question}
                    variant="outlined"
                    clickable
                    size="small"
                    onClick={() => sendMessage(question)}
                    sx={{ mb: 1 }}
                  />
                ))}
              </Box>
            </Box>
          )}

          {/* Messages List */}
          <Box sx={{ flex: 1, overflow: 'auto', px: 2, pb: 1 }}>
            <List sx={{ py: 0 }}>
              {messages.map((message) => (
                <ListItem key={message.id} sx={{ px: 0, py: 1, alignItems: 'flex-start' }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: '85%',
                      ml: message.role === 'user' ? 'auto' : 0,
                      mr: message.role === 'assistant' ? 'auto' : 0,
                      backgroundColor: message.role === 'user'
                        ? 'primary.main'
                        : 'grey.100',
                      color: message.role === 'user' ? 'white' : 'text.primary',
                    }}
                  >
                    <Box display="flex" alignItems="flex-start" gap={1}>
                      {message.role === 'assistant' ? (
                        <BotIcon sx={{ fontSize: 20, mt: 0.2, color: '#2196F3' }} />
                      ) : (
                        <PersonIcon sx={{ fontSize: 20, mt: 0.2 }} />
                      )}
                      <Box flex={1}>
                        <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                          {message.content}
                        </Typography>
                        <Box display="flex" justifyContent="space-between" alignItems="center" mt={1}>
                          <Typography variant="caption" sx={{ opacity: 0.7 }}>
                            {formatTimestamp(message.timestamp)}
                          </Typography>
                          {message.response_time && (
                            <Typography variant="caption" sx={{ opacity: 0.7 }}>
                              {(message.response_time / 1000).toFixed(1)}s
                            </Typography>
                          )}
                        </Box>
                      </Box>
                    </Box>
                  </Paper>
                </ListItem>
              ))}

              {/* Typing Indicator */}
              {isTyping && (
                <ListItem sx={{ px: 0, py: 1 }}>
                  <Paper
                    elevation={1}
                    sx={{
                      p: 2,
                      maxWidth: '85%',
                      backgroundColor: 'grey.100',
                    }}
                  >
                    <Box display="flex" alignItems="center" gap={1}>
                      <BotIcon sx={{ fontSize: 20, color: '#2196F3' }} />
                      <CircularProgress size={16} />
                      <Typography variant="body2" color="text.secondary">
                        Thinking...
                      </Typography>
                    </Box>
                  </Paper>
                </ListItem>
              )}
            </List>
            <div ref={messagesEndRef} />
          </Box>
        </DialogContent>

        <DialogActions sx={{ p: 2, pt: 1 }}>
          <Box display="flex" width="100%" gap={1}>
            <TextField
              fullWidth
              multiline
              maxRows={3}
              placeholder="Ask me about your health..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={isTyping || aiStatus === false}
              variant="outlined"
              size="small"
            />
            <Button
              variant="contained"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isTyping || aiStatus === false}
              startIcon={isTyping ? <CircularProgress size={16} /> : <SendIcon />}
              sx={{ minWidth: 'auto', px: 2 }}
            >
              Send
            </Button>
          </Box>
        </DialogActions>
      </Dialog>
    </>
  );
}