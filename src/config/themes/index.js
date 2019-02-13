import red from '@material-ui/core/colors/red';
import pink from '@material-ui/core/colors/pink';
import green from '@material-ui/core/colors/green';
import blue from '@material-ui/core/colors/blue';
import { createMuiTheme } from '@material-ui/core/styles';

const themes = [
  {
    id: 'default',
    color: blue[500],
  },
  {
    id: 'red',
    color: red[500],
    source: {
      palette: {
        primary: red,
        secondary: pink,
        error: red,
      },
    },
  },
  {
    id: 'green',
    color: green[500],
    source: {
      palette: {
        primary: green,
        secondary: red,
        error: red,
      },
    },
  },
];

export { themes };
const getThemeSource = (t, ts) => {
  if (ts) {
    for (let i = 0; i < ts.length; i++) {
      if (ts[i].id === t.source) {
        const source = ts[i].source;
        const palette = source != null ? source.palette : {};

        return createMuiTheme({
          ...source,
          palette: { ...palette, type: t.isNightModeOn ? 'dark' : 'light' },
          typography: {
            useNextVariants: true,
          },
        });
      }
    }
  }

  return createMuiTheme({
    palette: { type: t.isNightModeOn ? 'dark' : 'light' },
    typography: {
      useNextVariants: true,
    },
  }); // Default theme
};

export default getThemeSource;
