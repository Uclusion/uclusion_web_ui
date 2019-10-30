import blue from '@material-ui/core/colors/blue';
import { createMuiTheme } from '@material-ui/core/styles';

const defaultThemeDefinition = {
  palette: {
    primary: {
      main: '#8ab5c2',
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
  },
};

const defaultTheme = createMuiTheme({
  ...defaultThemeDefinition,
}, 'default');

const sidebarTheme = createMuiTheme({
  palette: {
    type: 'light',
    ...defaultThemeDefinition.palette,
    text: {
      primary: '#3f6b72',
      secondary: '#3f6b72',
    },

  },
});
const issueTheme = createMuiTheme({
  ...defaultThemeDefinition,
  palette: {
    text: {
      primary: '#f00',
      secondary: '#000',
    },
    primary: {
      light: '#757ce8',
      main: '#3f50b5',
      dark: '#002884',
      contrastText: '#fff',
    },
    secondary: {
      light: '#ff7961',
      main: '#f44336',
      dark: '#ba000d',
      contrastText: '#000',
    },
  },
});

export { defaultTheme, sidebarTheme, issueTheme };
