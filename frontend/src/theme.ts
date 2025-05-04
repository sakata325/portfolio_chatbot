import { createTheme } from '@mui/material/styles';
// PaletteOptions と Palette はモジュール拡張で暗黙的に参照されるため import 不要な場合もある

// Augment the Palette interface
declare module '@mui/material/styles' { // Corrected module path
  interface Palette { // No extends needed
    chat?: {
      toggleButtonBg?: string;
      toggleButtonHoverBg?: string;
      sendButtonDisabledBg?: string;
      sendButtonDisabledIcon?: string;
      iconColor?: string;
      userBg?: string;
      userText?: string;
      botBg?: string;
      botText?: string;
      inputBg?: string;
      inputText?: string;
      inputBorder?: string;
      inputHoverBorder?: string;
      inputFocusBorder?: string;
    };
  }
  // Augment the PaletteOptions interface
  interface PaletteOptions { // No extends needed
    chat?: {
      toggleButtonBg?: string;
      toggleButtonHoverBg?: string;
      sendButtonDisabledBg?: string;
      sendButtonDisabledIcon?: string;
      iconColor?: string;
      userBg?: string;
      userText?: string;
      botBg?: string;
      botText?: string;
      inputBg?: string;
      inputText?: string;
      inputBorder?: string;
      inputHoverBorder?: string;
      inputFocusBorder?: string;
    };
  }
}

// Create a dark theme instance based on the inspiration image
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#000000', // Keep black background
      // Adjust paper for message bubbles if needed globally, or handle in component
      paper: 'rgba(30, 30, 30, 0.7)', // Example: Darker semi-transparent paper
    },
    text: {
      primary: '#FFFFFF', 
      secondary: '#B0B0B0', 
    },
    // Add chat specific colors
    chat: {
      // Toggle Button
      toggleButtonBg: 'rgba(0, 0, 0, 0.8)',
      toggleButtonHoverBg: 'rgba(0, 0, 0, 0.6)',
      // Send Button
      sendButtonDisabledBg: '#757575', 
      sendButtonDisabledIcon: 'rgba(255, 255, 255, 0.5)',
      iconColor: '#FFFFFF', 
      // Message Bubbles
      userBg: '#333333', // Dark grey for user
      userText: '#FFFFFF', // White text for user
      botBg: '#FFFFFF', // White for bot
      botText: '#000000', // Black text for bot
      // Input Field
      inputBg: '#FFFFFF',
      inputText: '#000000',
      inputBorder: 'rgba(0, 0, 0, 0.2)',
      inputHoverBorder: 'rgba(0, 0, 0, 0.4)',
      inputFocusBorder: 'rgba(0, 0, 0, 0.6)',
    },
  },
  typography: {
    fontFamily: 'sans-serif',
    h6: {
      fontSize: '1.1rem',
    },
    body1: {
      fontSize: '0.9rem',
    },
  },
});

export default theme; 