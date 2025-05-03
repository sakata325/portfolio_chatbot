import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import CircularProgress from '@mui/material/CircularProgress'; // ローディング表示用

// TODO: Define message type properly
interface Message {
  id: number;
  text: string;
  sender: 'user' | 'bot';
}

const ChatWidget: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  // Initial message from bot
  useEffect(() => {
    setMessages([{ id: Date.now(), text: 'こんにちは！私について何でも聞いてください。', sender: 'bot' }]);
  }, []);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const userMessage: Message = { id: Date.now(), text: inputValue, sender: 'user' };
    setMessages(prev => [...prev, userMessage]);
    const currentInput = inputValue; // Store input value before clearing
    setInputValue('');
    setIsLoading(true);

    try {
      // API のベース URL を環境変数から取得
      // ローカル開発時は Vite Dev Server が .env を読み込む
      // ビルド時はビルド時の環境変数が埋め込まれる
      const apiUrl = `${import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'}/api/chat`;

      const response = await fetch(apiUrl, { // 環境変数から取得した URL を使用
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ message: currentInput }), // Use the stored input value
      });

      if (!response.ok) {
        // Handle HTTP errors (e.g., 4xx, 5xx)
        const errorData = await response.json().catch(() => ({ detail: 'Failed to parse error response' }));
        console.error('API Error:', response.status, errorData);
        throw new Error(errorData.detail || `HTTP error ${response.status}`);
      }

      const data: ChatResponse = await response.json(); // Use the ChatResponse type defined in backend
      const botResponse: Message = { id: Date.now() + 1, text: data.reply, sender: 'bot' };
      setMessages(prev => [...prev, botResponse]);

    } catch (error) {
      console.error('Error sending message:', error);
      // Display a more informative error message to the user
      const errorMessage = error instanceof Error ? error.message : 'メッセージの送信中に不明なエラーが発生しました。';
      const errorResponse: Message = { id: Date.now() + 1, text: `エラー: ${errorMessage}`, sender: 'bot' };
      setMessages(prev => [...prev, errorResponse]);
    } finally {
      setIsLoading(false);
    }
  };

  // Interface matching backend/app/models.py
  interface ChatResponse {
      reply: string;
  }

  return (
    <Paper
      elevation={0} // No shadow needed for fullscreen
      sx={{
        width: '100%',       // Fill width
        height: '100vh',     // Fill viewport height
        // Remove fixed positioning and offsets
        // position: 'fixed',
        // bottom: '20px',
        // right: '20px',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent', // Let theme handle background or make fully transparent
        overflow: 'hidden', // Prevent potential scrollbars on the main paper
      }}
    >
      <Box sx={{ p: 1, borderBottom: '1px solid rgba(255, 255, 255, 0.1)' /* Subtle border */ }}>
        {/* Adjusted padding and removed background color */}
        <Typography variant="h6" align="center"> {/* Centered Title */}
          HAYATA SAKATA AI {/* Changed title? */}
        </Typography>
      </Box>
      <Box sx={{ flexGrow: 1, overflowY: 'auto', p: 2 }}>
        <List>
          {messages.map((msg) => (
            <ListItem key={msg.id} sx={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              <Paper
                elevation={1}
                sx={{
                  p: 1.5, // Slightly more padding
                  maxWidth: '80%',
                  // Glassmorphism for message bubbles
                  bgcolor: msg.sender === 'user'
                    ? 'rgba(255, 255, 255, 0.1)' // User message glass
                    : 'rgba(50, 50, 50, 0.3)', // Bot message glass
                  backdropFilter: 'blur(10px)',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  borderRadius: '10px', // Rounded corners
                  color: 'text.primary',
                }}
              >
                <ListItemText primary={msg.text} />
              </Paper>
            </ListItem>
          ))}
           {isLoading && (
            <ListItem sx={{ justifyContent: 'center' }}>
              <CircularProgress size={24} color="inherit" />
            </ListItem>
          )}
        </List>
      </Box>
      {/* Input area with Glassmorphism */}
      <Box sx={{
        p: 2,
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        display: 'flex',
        alignItems: 'center',
        background: 'rgba(0, 0, 0, 0.5)', // Semi-transparent black background
        backdropFilter: 'blur(10px)',
      }}>
        <TextField
          fullWidth
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
          sx={{ 
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px', // Rounded input field
              // Glassmorphism for input field itself
              bgcolor: 'rgba(255, 255, 255, 0.05)',
              backdropFilter: 'blur(5px)',
              '& fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.2)', // Subtle border
              },
              '&:hover fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.4)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(255, 255, 255, 0.6)',
              },
            },
            '& .MuiInputBase-input': {
              color: 'text.primary',
            },
          }}
        />
        <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            sx={{ 
              ml: 1, 
              borderRadius: '20px', // Rounded button
              bgcolor: 'rgba(255, 255, 255, 0.1)', // Glass button
              backdropFilter: 'blur(10px)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: 'text.primary',
              '&:hover': {
                bgcolor: 'rgba(255, 255, 255, 0.2)',
              }
             }}
        >
           送信
        </Button>
      </Box>
    </Paper>
  );
};

export default ChatWidget; 