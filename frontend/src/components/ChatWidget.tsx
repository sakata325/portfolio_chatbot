import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import SendIcon from '@mui/icons-material/Send';
import { useTheme } from '@mui/material/styles';

interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

// Interface matching backend/app/models.py
interface ChatResponse {
    reply: string;
}

const ChatWidget: React.FC = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  // Initial message from bot
  useEffect(() => {
    setMessages([{ id: Date.now(), text: 'こんにちは！私について何でも聞いてください。', sender: 'bot' }]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = { id: Date.now(), text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue;
    setInputValue('');
    setIsLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/chat`;
      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentInput }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.detail || `HTTP error ${response.status}`);
      }

      const data: ChatResponse = await response.json();
      const botResponse: Message = { id: Date.now() + 1, text: data.reply, sender: 'bot' };
      setMessages(prev => [...prev, botResponse]);

    } catch (error) {
      console.error('Error sending message:', error);
      const errorMessage = error instanceof Error ? error.message : 'メッセージの送信中に不明なエラーが発生しました。';
      const errorResponse: Message = { id: Date.now() + 1, text: `エラー: ${errorMessage}`, sender: 'bot' };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Box sx={{ width: '100%', height: '100%' }}>
      <Paper
        elevation={0}
        sx={{
          width: '100%',
          height: '100%',
          borderRadius: 0,
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          backgroundColor: 'transparent',
          boxShadow: 'none',
        }}
      >
        <Box sx={{
            flexGrow: 1,
            overflowY: 'auto',
            p: 2,
            '&::-webkit-scrollbar': { display: 'none' },
            scrollbarWidth: 'none',
            msOverflowStyle: 'none',
           }}>
          <List sx={{ pt: 0, pb: 0 }}>
            {messages.map((msg) => (
              <ListItem
                  key={msg.id}
                  sx={{
                      justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                      px: 0,
                      py: 0.5
                  }}>
                {/* Message Bubbles */}
                <Paper
                  elevation={0}
                  sx={{
                    p: 1.5,
                    maxWidth: '80%',
                    background: msg.sender === 'user'
                      ? theme.palette.chat?.userBg
                      : theme.palette.chat?.botBg,
                    color: msg.sender === 'user'
                      ? theme.palette.chat?.userText
                      : theme.palette.chat?.botText,
                    border: 'none',
                    borderRadius: '12px',
                    boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
                    wordBreak: 'break-word',
                  }}
                >
                  <ListItemText primary={msg.text} sx={{ m: 0 }} />
                </Paper>
              </ListItem>
            ))}
            {isLoading && (
              <ListItem sx={{ justifyContent: 'flex-start', px: 0, py: 0.5 }}>
                <Paper sx={{ p: 1.5, background: theme.palette.chat?.userBg, color: theme.palette.chat?.userText, borderRadius: '12px', boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)' }}>
                  <CircularProgress size={20} color="inherit" />
                </Paper>
              </ListItem>
            )}
            <div ref={messagesEndRef} />
          </List>
        </Box>

        {/* Input Area */}
        <Box sx={{
          p: 1.5,
          display: 'flex',
          alignItems: 'flex-end',
          backgroundColor: 'transparent',
          flexShrink: 0,
        }}>
          <TextField
            variant="outlined"
            size="small"
            placeholder="メッセージを入力..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
            multiline
            maxRows={3}
            sx={{
              flexGrow: 1,
              mr: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                backgroundColor: theme.palette.chat?.inputBg,
                '& fieldset': { borderColor: theme.palette.chat?.inputBorder },
                '&:hover fieldset': { borderColor: theme.palette.chat?.inputHoverBorder },
                '&.Mui-focused fieldset': { borderColor: theme.palette.chat?.inputFocusBorder },
              },
              '& .MuiInputBase-input': {
                color: theme.palette.chat?.inputText,
              },
             }}
          />
          <IconButton
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            sx={{
              bgcolor: theme.palette.chat?.toggleButtonBg,
              color: theme.palette.chat?.iconColor,
              border: 'none',
              boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
              '&:hover': {
                bgcolor: theme.palette.chat?.toggleButtonHoverBg,
              },
              '&.Mui-disabled': {
                  backgroundColor: theme.palette.chat?.sendButtonDisabledBg,
                  color: theme.palette.chat?.sendButtonDisabledIcon
              },
              width: 40,
              height: 40,
              flexShrink: 0,
            }}
          >
             <SendIcon fontSize="small" />
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatWidget;



