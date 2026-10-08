import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { createTheme, ThemeProvider } from '@mui/material/styles'
import './styles/index.css'
import './styles/ui.css'
import './styles/common.css'
import './styles/error.css'
import App from './App.jsx'

const theme = createTheme({
  palette: {
    primary: { main: '#167a5a', dark: '#105e45', light: '#e8f4ee' },
    error: { main: '#c74949' },
    background: { default: '#f7f8f6', paper: '#fff' },
    text: { primary: '#202b27', secondary: '#7c8982' },
  },
  shape: { borderRadius: 12 },
  typography: {
    fontFamily: "'DM Sans', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    button: { fontWeight: 600, textTransform: 'none' },
  },
})

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <ThemeProvider theme={theme}>
      <App />
    </ThemeProvider>
  </StrictMode>,
)
