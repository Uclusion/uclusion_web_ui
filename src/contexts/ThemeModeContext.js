import React, { useState, useEffect, useMemo } from 'react';
import { ThemeProvider } from '@material-ui/core/styles';
import { CssBaseline } from '@material-ui/core';
import { defaultTheme, darkTheme } from '../config/themes';

const THEME_MODE_KEY = 'uclusion_theme_mode';

const ThemeModeContext = React.createContext(['light', () => {}]);

function ThemeModeProvider(props) {
  const { children } = props;
  
  const [themeMode, setThemeMode] = useState(() => {
    // Initialize from localStorage or default to 'light'
    const savedMode = localStorage.getItem(THEME_MODE_KEY);
    return savedMode === 'dark' ? 'dark' : 'light';
  });

  useEffect(() => {
    // Persist theme mode to localStorage whenever it changes
    localStorage.setItem(THEME_MODE_KEY, themeMode);
  }, [themeMode]);

  const toggleThemeMode = () => {
    setThemeMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  const theme = useMemo(() => {
    return themeMode === 'dark' ? darkTheme : defaultTheme;
  }, [themeMode]);

  return (
    <ThemeModeContext.Provider value={[themeMode, toggleThemeMode]}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeModeContext.Provider>
  );
}

export { ThemeModeContext, ThemeModeProvider };
