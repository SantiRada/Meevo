import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'


import { applyThemeColors, getCustomThemeColors, type ThemeMode } from './utils/themeColors';

const savedTheme = (localStorage.getItem('meevo-theme') as ThemeMode) || 'Dark';
const customColors = getCustomThemeColors();
applyThemeColors(savedTheme, customColors[savedTheme]);

ReactDOM.createRoot(document.getElementById('root')!).render(

  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
