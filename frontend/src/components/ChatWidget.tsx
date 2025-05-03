import React, { useState, useEffect, useRef } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import TextField from '@mui/material/TextField';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SendIcon from '@mui/icons-material/Send';
import Collapse from '@mui/material/Collapse';
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
  const [isOpen, setIsOpen] = useState(false);
  const messagesEndRef = useRef<null | HTMLDivElement>(null); // Ref for scrolling

  // Scroll to bottom when messages change or widget opens/closes
  useEffect(() => {
    if (isOpen) {
        // Use setTimeout to ensure DOM updates before scrolling
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100); // Small delay might be needed for Collapse animation
    }
  }, [messages, isOpen]);

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
    <Box>
      {/* Toggle Button - Fixed Position */}
      <IconButton
        onClick={() => setIsOpen(!isOpen)}
        sx={{
          position: 'fixed',
          bottom: 16,
          right: 16,
          zIndex: 1300, // Above the chat window
          color: theme.palette.chat?.iconColor,
          backgroundColor: theme.palette.chat?.toggleButtonBg,
          boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
          '&:hover': {
            backgroundColor: theme.palette.chat?.toggleButtonHoverBg,
          }
        }}
      >
        {isOpen ? <CloseIcon /> : <ChatIcon />}
      </IconButton>

      {/* Chat Window Container - Fixed Position Above Button */}
      <Collapse in={isOpen} timeout="auto" unmountOnExit>
        <Paper
          elevation={0} // No elevation/shadow
          sx={{
            position: 'fixed',
            bottom: 80, // Position above the button
            right: 16,
            width: '350px',
            height: '500px',
            zIndex: 1200, // Below the toggle button
            borderRadius: '15px', // Keep border radius for clipping content if needed
            overflow: 'hidden', // Needed for border radius clipping and containing scroll
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: 'transparent', // Transparent background
            boxShadow: 'none', // Explicitly no shadow
          }}
        >
          {/* Message List Area - Scrolls */}
          <Box sx={{
              flexGrow: 1,
              overflowY: 'auto',
              p: 2, // Padding inside scroll area
              // Hide scrollbar styles
              '&::-webkit-scrollbar': { display: 'none' }, // Chrome, Safari, Edge
              scrollbarWidth: 'none', // Firefox
              msOverflowStyle: 'none', // IE
             }}>
            <List sx={{ pt: 0, pb: 0 }}> {/* Remove List padding */}
              {messages.map((msg) => (
                <ListItem
                    key={msg.id}
                    sx={{
                        justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start',
                        px: 0, // No horizontal padding on ListItem
                        py: 0.5 // Vertical padding between messages
                    }}>
                  {/* Message Bubbles */}
                  <Paper
                    elevation={0} // Use boxShadow for bubble shadow
                    sx={{
                      p: 1.5,
                      maxWidth: '80%',
                      // Corrected Swapped UI using Theme: User=Dark, Bot=White
                      background: msg.sender === 'user'
                        ? theme.palette.chat?.userBg // User: Dark grey bg from theme
                        : theme.palette.chat?.botBg,  // Bot: White bg from theme
                      color: msg.sender === 'user'
                        ? theme.palette.chat?.userText // User: White text from theme
                        : theme.palette.chat?.botText, // Bot: Black text from theme
                      border: 'none',
                      borderRadius: '12px',
                      boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)',
                      wordBreak: 'break-word',
                    }}
                  >
                    <ListItemText primary={msg.text} sx={{ m: 0 }} /> {/* Remove margin from ListItemText */}
                  </Paper>
                </ListItem>
              ))}
              {isLoading && (
                <ListItem sx={{ justifyContent: 'flex-start', px: 0, py: 0.5 }}>
                    {/* Loading bubble uses user style (dark grey bg, white text) */}
                  <Paper elevation={0} sx={{ p: 1.5, background: theme.palette.chat?.userBg, color: theme.palette.chat?.userText, borderRadius: '12px', boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)' }}>
                    <CircularProgress size={20} color="inherit" />
                  </Paper>
                </ListItem>
              )}
              {/* Empty div to scroll to */}
              <div ref={messagesEndRef} />
            </List>
          </Box>

          {/* Input Area */}
          <Box sx={{
            p: 1.5,
            display: 'flex',
            // Align items to the end of the cross axis (bottom for row direction)
            alignItems: 'flex-end',
            backgroundColor: 'transparent', // Transparent background
            flexShrink: 0,
            // No borderTop
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
                // Ensure input background is white and borders are visible
                '& .MuiOutlinedInput-root': {
                  borderRadius: '20px',
                  // Use theme colors for input field
                  backgroundColor: theme.palette.chat?.inputBg,
                  '& fieldset': { borderColor: theme.palette.chat?.inputBorder },
                  '&:hover fieldset': { borderColor: theme.palette.chat?.inputHoverBorder },
                  '&.Mui-focused fieldset': { borderColor: theme.palette.chat?.inputFocusBorder },
                },
                // Adjust padding for multiline
                '& .MuiInputBase-input': {
                   // Use theme color for input text
                  color: theme.palette.chat?.inputText,
                  // py: '8.5px', // Remove explicit padding to try default alignment
                },
               }}
            />
            <IconButton
              onClick={handleSendMessage}
              disabled={isLoading || !inputValue.trim()}
              sx={{
                // Send button uses toggle button colors (normal/hover) from theme
                bgcolor: theme.palette.chat?.toggleButtonBg, // Use toggle button color
                color: theme.palette.chat?.iconColor,    // Use general icon color
                border: 'none',
                boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
                '&:hover': {
                  bgcolor: theme.palette.chat?.toggleButtonHoverBg, // Use toggle button hover color
                },
                // Keep specific disabled style from theme
                '&.Mui-disabled': {
                    backgroundColor: theme.palette.chat?.sendButtonDisabledBg,
                    color: theme.palette.chat?.sendButtonDisabledIcon
                },
                width: 40,
                height: 40,
                flexShrink: 0,
                // No alignSelf needed if parent uses alignItems: 'flex-end'
              }}
            >
               <SendIcon fontSize="small" />
            </IconButton>
          </Box>
        </Paper>
      </Collapse>
    </Box>
  );
};

export default ChatWidget;



