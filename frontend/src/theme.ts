import { createTheme } from '@mui/material/styles';

// Create a dark theme instance based on the inspiration image
const theme = createTheme({
  palette: {
    mode: 'dark',
    background: {
      default: '#000000', // Black background
      paper: 'rgba(40, 40, 40, 0.6)', // Slightly transparent dark grey for paper elements
    },
    text: {
      primary: '#FFFFFF', // White primary text
      secondary: '#B0B0B0', // Light grey secondary text
    },
    primary: {
      main: '#FFFFFF', // Use white for primary interactions like button text?
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