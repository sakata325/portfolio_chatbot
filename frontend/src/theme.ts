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
      primary: '#FFFFFF', // White primary text
      secondary: '#B0B0B0', // Light grey secondary text
    },
    primary: {
      main: '#90caf9', // Example: Light blue for accents (adjust as needed)
    },
    secondary: {
      main: '#f48fb1', // Example: Pink accent (adjust as needed)
    },
    // Add chat specific colors
    chat: {
      // Toggle Button
      toggleButtonBg: 'rgba(0, 0, 0, 0.8)',
      toggleButtonHoverBg: 'rgba(0, 0, 0, 0.6)',
      // Send Button - Use toggle button colors now (definitions removed)
      sendButtonDisabledBg: '#757575', // Keep specific disabled style
      sendButtonDisabledIcon: 'rgba(255, 255, 255, 0.5)', // Keep specific disabled style
      iconColor: '#FFFFFF', // Added general icon color
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
    // Define other colors if needed
  },
  typography: {
    fontFamily: 'sans-serif', // Simple sans-serif font
    // Adjust default font sizes if needed (MUI defaults might be okay)
    h6: {
      fontSize: '1.1rem',
    },
    body1: {
      fontSize: '0.9rem',
    },
  },
  components: {
    // Example: Style buttons if needed
    // MuiButton: {
    //   styleOverrides: {
    //     root: {
    //       color: '#000000', // Black text on white button
    //     },
    //   },
    // },
  },
});

export default theme; 