import blue from '@material-ui/core/colors/blue';
import red from '@material-ui/core/colors/red';
import yellow from '@material-ui/core/colors/yellow';
import { createMuiTheme } from '@material-ui/core/styles';

const defaultThemeDefinition = {
  id: 'default',
  color: blue[500],
  palette: {
    type: 'light',
  },
  typography: {
    useNextVariants: true,
  },
};

const defaultTheme = createMuiTheme({
  ...defaultThemeDefinition,
});

const sideBarTheme = createMuiTheme({
  ...defaultThemeDefinition,
  palette: { ...defaultThemeDefinition.palette, type: 'dark' },
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

export { defaultTheme, sideBarTheme, issueTheme };
