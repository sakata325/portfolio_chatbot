import React, { useState, useEffect } from 'react';
import Box from '@mui/material/Box';
import Paper from '@mui/material/Paper';
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
    <Box
      sx={{
        width: '100%',
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: 'transparent',
        p: 1,
      }}
    >
      {/* Message List Area - Add padding-bottom */}
      <Box sx={{
          flexGrow: 1,
          overflowY: 'auto',
          px: 1,
          pb: 4, // *** Added padding-bottom to give space for shadow ***
          // Hide scrollbar styles
          '&::-webkit-scrollbar': {
            display: 'none',
          },
          scrollbarWidth: 'none', // For Firefox
          msOverflowStyle: 'none', // For IE/Edge
         }}>
        <List>
          {messages.map((msg) => (
            <ListItem key={msg.id} sx={{ justifyContent: msg.sender === 'user' ? 'flex-end' : 'flex-start' }}>
              {/* Message Bubbles - Reverted to Dark Gradient theme */}
              <Paper
                elevation={0}
                sx={{
                  p: 1.5,
                  maxWidth: '80%',
                  // Reverted to Dark Gradient Backgrounds
                  background: msg.sender === 'user'
                    // Example User Gradient (Light Grey to Darker Grey)
                    ? 'linear-gradient(145deg,rgb(255, 255, 255),rgb(247, 250, 255))'
                    // Example Bot Gradient (Dark Grey to Near Black)
                    : 'linear-gradient(145deg,rgb(31, 58, 88), #212121)',
                  // Reverted text colors
                  color: msg.sender === 'user'
                    ? '#000000' // User: Black text
                    : '#FFFFFF', // Bot: White text
                  border: 'none',
                  borderRadius: '12px',
                  // Keep the stronger shadow from previous edits
                  boxShadow: '0 12px 28px 0 rgba(0, 0, 0, 0.2), 0 2px 4px 0 rgba(0, 0, 0, 0.15)',
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

      {/* Input Area - Container is transparent */}
      <Box sx={{
        p: 1.5,
        display: 'flex',
        alignItems: 'center',
        mt: 1,
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
          sx={{ 
            flexGrow: 1,
            mr: 1,
            '& .MuiOutlinedInput-root': {
              borderRadius: '20px',
              // Off-white background for TextField
              bgcolor: '#f5f5f5', // Very light grey
              '& fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.15)', // Adjusted border
              },
              '&:hover fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.25)',
              },
              '&.Mui-focused fieldset': {
                borderColor: 'rgba(0, 0, 0, 0.4)',
              },
            },
            '& .MuiInputBase-input': {
              color: '#000000',
            },
          }}
        />
        <Button
            variant="contained"
            onClick={handleSendMessage}
            disabled={isLoading || !inputValue.trim()}
            sx={{ 
              borderRadius: '20px',
              bgcolor: '#FFFFFF', // White button background
              color: '#333333', // Dark grey text color
              border: '1px solid rgba(0, 0, 0, 0.2)', // Visible border
              boxShadow: '0 2px 4px 0 rgba(0, 0, 0, 0.1)',
              minWidth: 'auto',
              px: 2.5,
              whiteSpace: 'nowrap',
              '&:hover': {
                bgcolor: '#f5f5f5', // Light grey on hover
                boxShadow: '0 3px 6px 0 rgba(0, 0, 0, 0.15)',
              }
             }}
        >
           送信
        </Button>
      </Box>
    </Box>
  );
};

export default ChatWidget; 