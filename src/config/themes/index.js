import { createTheme, responsiveFontSizes } from '@material-ui/core/styles';

const baseThemeConfig = {
  typography: {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 15,
  },
  props: {
    // Change the default options of useMediaQuery
    MuiUseMediaQuery: {
      noSsr: true
    },
  },
};

const lightThemeDefinition = {
  ...baseThemeConfig,
  palette: {
    type: 'light',
    primary: {
      main: '#2F80ED',
      light: '#EDF7F8',
      dark: '#5b8592',
      contrastText: '#ffffff',
    },
    secondary: {
      main: '#3f6b72',
      light: '#6d99a0',
      dark: '#104047',
      contrastText: '#ffffff',
    },
    background: {
      default: '#ffffff',
      paper: '#DFF0F2',
    },
    text: {
      primary: 'rgba(0, 0, 0, 0.87)',
      secondary: 'rgba(0, 0, 0, 0.54)',
    },
  },
};

const darkThemeDefinition = {
  ...baseThemeConfig,
  palette: {
    type: 'dark',
    primary: {
      main: '#5BA3F5',
      light: '#1e2e30',
      dark: '#2F80ED',
      contrastText: '#000000',
    },
    secondary: {
      main: '#6d99a0',
      light: '#9fccd3',
      dark: '#3f6b72',
      contrastText: '#000000',
    },
    background: {
      default: '#121212',
      paper: '#2a3a3c',
    },
    text: {
      primary: '#ffffff',
      secondary: 'rgba(255, 255, 255, 0.7)',
    },
  },
  overrides: {
    MuiPaper: {
      root: {
        backgroundColor: '#1e1e1e',
      },
    },
    MuiAppBar: {
      root: {
        backgroundColor: '#1e1e1e',
      },
    },
    MuiCard: {
      root: {
        backgroundColor: '#1e1e1e',
      },
    },
    MuiDialog: {
      paper: {
        backgroundColor: '#1e1e1e',
      },
    },
    MuiMenu: {
      paper: {
        backgroundColor: '#1e1e1e',
      },
    },
    MuiTooltip: {
      tooltip: {
        backgroundColor: '#333333',
      },
    },
  },
};

const defaultTheme = responsiveFontSizes(createTheme(lightThemeDefinition));
const darkTheme = responsiveFontSizes(createTheme(darkThemeDefinition));

export { defaultTheme, darkTheme };
