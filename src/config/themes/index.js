import blue from '@material-ui/core/colors/blue';
import red from '@material-ui/core/colors/red';
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

const sideBarTheme = createMuiTheme({ ...defaultThemeDefinition, palette: { ...defaultThemeDefinition.palette, type: 'dark'}});

const issueTheme = createMuiTheme( {
  ...defaultThemeDefinition,
  color: red[500],
});

export { defaultTheme, sideBarTheme, issueTheme };
