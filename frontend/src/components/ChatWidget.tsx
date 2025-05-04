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
  id: number; // Or string if using UUIDs on frontend too
  text: string;
  sender: 'user' | 'bot';
}

// Interface matching backend/app/models.py (Updated)
interface ChatResponse {
  message: string; // Changed from reply
  session_id: string;
}

const SESSION_STORAGE_KEY = 'chatSessionId'; // Key for sessionStorage

const ChatWidget: React.FC = () => {
  const theme = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null); // State to hold session ID
  const messagesEndRef = useRef<null | HTMLDivElement>(null);

  // Load session ID from sessionStorage on initial mount
  useEffect(() => {
    const storedSessionId = sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (storedSessionId) {
      setSessionId(storedSessionId);
      console.log("Loaded session ID:", storedSessionId);
      // Optionally, you could fetch history here if backend supports it
      // For now, just start with the initial bot message
      setMessages([{ id: Date.now(), text: 'こんにちは！私について何でも聞いてください。', sender: 'bot' }]);
    } else {
       // No existing session, start with the initial bot message
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

  // Removed initial bot message from here, handled in session ID load effect

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessageText = inputValue; // Store text before clearing input
    const userMessage: Message = { id: Date.now(), text: userMessageText, sender: 'user' };
    setMessages(prev => [...prev, userMessage]); // Add user message immediately
    setInputValue('');
    setIsLoading(true);

    try {
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/chat`;

      // Get current session ID from state
      const currentSessionId = sessionId;
      console.log("Sending with session ID:", currentSessionId); // Log session ID being sent

      const requestBody = {
        message: userMessageText,
        session_id: currentSessionId, // Send null if no session yet
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

      // Expecting { message: string, session_id: string } from backend
      const data: ChatResponse = await response.json();

      // Store/Update session ID
      if (data.session_id && data.session_id !== currentSessionId) {
        console.log("Received new/updated session ID:", data.session_id);
        sessionStorage.setItem(SESSION_STORAGE_KEY, data.session_id);
        setSessionId(data.session_id); // Update state
      } else if (!sessionId && data.session_id) {
         // Handle the case where it was the first request and we got a session ID back
         console.log("Received first session ID:", data.session_id);
         sessionStorage.setItem(SESSION_STORAGE_KEY, data.session_id);
         setSessionId(data.session_id); // Update state
      }


      const botResponse: Message = { id: Date.now() + 1, text: data.message, sender: 'bot' };
      setMessages(prev => [...prev, botResponse]); // Add bot response

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
                  key={msg.id} // Ensure unique keys
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
            alignItems: 'flex-end', // Align items to bottom for multiline
            backgroundColor: 'transparent', // Ensure input area bg is transparent
        }}>
           <TextField
            variant="outlined"
            size="small"
            placeholder="メッセージを入力..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) { // Allow Shift+Enter for newline
                e.preventDefault();
                handleSendMessage();
              }
            }}
            disabled={isLoading}
            multiline
            maxRows={3} // Limit expansion
            sx={{
              flexGrow: 1,
              mr: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: '20px',
                backgroundColor: theme.palette.chat?.inputBg ?? '#ffffff', // Provide default
                '& fieldset': { borderColor: theme.palette.chat?.inputBorder ?? '#ced4da' },
                '&:hover fieldset': { borderColor: theme.palette.chat?.inputHoverBorder ?? '#adb5bd' },
                '&.Mui-focused fieldset': { borderColor: theme.palette.chat?.inputFocusBorder ?? theme.palette.primary.main },
              },
              '& .MuiInputBase-input': {
                 color: theme.palette.chat?.inputText ?? '#212529',
                 // Add scrollbar for multiline input if needed
                 overflowY: 'auto',
                 maxHeight: 'calc(1.4375em * 3)', // Matches maxRows approx.
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
               border: 'none', // Added explicitly
               boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)', // Added explicitly
              '&:hover': {
                bgcolor: theme.palette.chat?.toggleButtonHoverBg ?? theme.palette.primary.dark, // Provide default hover
              },
              '&.Mui-disabled': {
                  backgroundColor: theme.palette.chat?.sendButtonDisabledBg ?? '#e0e0e0',
                  color: theme.palette.chat?.sendButtonDisabledIcon ?? '#bdbdbd',
              },
               width: 40,
               height: 40, // Match TextField height when small
               alignSelf: 'flex-end', // Ensure button stays at bottom
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



 