import { createTheme, responsiveFontSizes } from '@material-ui/core/styles';

const defaultThemeDefinition = {
  typography: {
    fontFamily: 'DM Sans, sans-serif',
    fontSize: 15,
  },
  palette: {
    primary: {
      main: '#2F80ED',
      light: '#bbe7f5',
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
      default: '#ffffff'
    }
  },
  props: {
    // Change the default options of useMediaQuery
    MuiUseMediaQuery: {
      noSsr: true
    },
  },
};


const defaultTheme = responsiveFontSizes(createTheme(defaultThemeDefinition));

export { defaultTheme };
