import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// import { ThemeProvider } from '@mui/material/styles'; // Removed ThemeProvider
// import CssBaseline from '@mui/material/CssBaseline'; // Removed CssBaseline
// import theme from './theme'; // Removed theme import
import './index.css'
import App from './App.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {/* <ThemeProvider theme={theme}> */}
      {/* <CssBaseline /> */}
      <App />
    {/* </ThemeProvider> */}
  </StrictMode>,
)
