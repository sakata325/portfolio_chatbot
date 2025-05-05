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

interface ChatResponse {
  message: string;
  session_id: string;
}

const SESSION_STORAGE_KEY = 'chatSessionId';

const ChatWidget: React.FC = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Load session ID from sessionStorage on initial mount
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSessionId) {
      setSessionId(storedSessionId);
      console.log("Loaded session ID:", storedSessionId);
      setMessages([{ id: Date.now(), text: 'こんにちは！私について何でも聞いてください。', sender: 'bot' }]);
    } else {
      setMessages([{ id: Date.now(), text: 'こんにちは！私について何でも聞いてください。', sender: 'bot' }]);
      console.log("No session ID found, starting fresh.");
    }
  }, []);

  // Scroll to bottom when messages change
  useEffect(() => {
    setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  }, [messages]);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessageText = inputValue;
    const userMessage: Message = { id: Date.now(), text: userMessageText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/chat`;

      const currentSessionId = sessionId;
      console.log("Sending with session ID:", currentSessionId);

      const requestBody = {
        message: userMessageText,
        session_id: currentSessionId,
      };

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.detail || `HTTP error ${response.status}`);
      }

      const data: ChatResponse = await response.json();

      if (data.session_id && data.session_id !== currentSessionId) {
        console.log("Received new/updated session ID:", data.session_id);
        sessionStorage.setItem(SESSION_STORAGE_KEY, data.session_id);
        setSessionId(data.session_id);
      } else if (!sessionId && data.session_id) {
        console.log("Received first session ID:", data.session_id);
        sessionStorage.setItem(SESSION_STORAGE_KEY, data.session_id);
        setSessionId(data.session_id);
      }

      const botResponse: Message = { id: Date.now() + 1, text: data.message, sender: 'bot' };
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
                 <Paper sx={{ p: 1.5, background: theme.palette.chat?.botBg, color: theme.palette.chat?.botText, borderRadius: '12px', boxShadow: '0 4px 12px 0 rgba(0, 0, 0, 0.15)' }}>
                   <CircularProgress size={20} color="inherit" />
                 </Paper>
              </ListItem>
            )}
            <div ref={messagesEndRef} />
          </List>
        </Box>

        {/* Input Area */}
         <Box sx={{
            flexShrink: 0,
            p: 1.5,
            display: 'flex',
            alignItems: 'flex-end',
            backgroundColor: 'transparent',
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
                backgroundColor: theme.palette.chat?.inputBg ?? '#ffffff',
                '& fieldset': { borderColor: theme.palette.chat?.inputBorder ?? '#ced4da' },
                '&:hover fieldset': { borderColor: theme.palette.chat?.inputHoverBorder ?? '#adb5bd' },
                '&.Mui-focused fieldset': { borderColor: theme.palette.chat?.inputFocusBorder ?? theme.palette.primary.main },
              },
              '& .MuiInputBase-input': {
                 color: theme.palette.chat?.inputText ?? '#212529',
                 overflowY: 'auto',
                 maxHeight: 'calc(1.4375em * 3)',
                 scrollbarWidth: 'thin',
                 '&::-webkit-scrollbar': {
                     width: '6px',
                 },
                 '&::-webkit-scrollbar-thumb': {
                     backgroundColor: 'rgba(0,0,0,.1)',
                     borderRadius: '3px',
                 },
              },
             }}
           />
          <IconButton
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            sx={{
               bgcolor: theme.palette.chat?.toggleButtonBg ?? theme.palette.primary.main,
               color: theme.palette.chat?.iconColor ?? '#fff',
               border: 'none',
               boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
              '&:hover': {
                bgcolor: theme.palette.chat?.toggleButtonHoverBg ?? theme.palette.primary.dark,
              },
              '&.Mui-disabled': {
                  backgroundColor: theme.palette.chat?.sendButtonDisabledBg ?? '#e0e0e0',
                  color: theme.palette.chat?.sendButtonDisabledIcon ?? '#bdbdbd',
              },
               width: 40,
               height: 40,
               alignSelf: 'flex-end',
            }}
          >
            <SendIcon fontSize="small"/>
          </IconButton>
        </Box>
      </Paper>
    </Box>
  );
};

export default ChatWidget;



 