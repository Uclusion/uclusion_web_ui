import React from 'react';
import { makeStyles } from '@material-ui/styles';
import { useTheme } from '@material-ui/core';

/**
 A context holding our styles for our wizards.
 It's centralized here to make it easier to change the theme across all wizards
 */

const WizardStylesContext = React.createContext({});
export const wizardStyles = makeStyles(
  theme => {
    return {
      inlineInputContainer: {
        display: 'flex',
        alignItems: 'center',
        marginTop: '0.5rem',
        marginBottom: '0.5rem',
      },
      inlineInputBox: {
        marginRight: '0.5rem',
        marginLeft: '0.5rem'
      },
      normal: {},
      hidden: {
        display: 'none',
      },
      creatingContainer: {
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      },
      title: {
        margin: '1rem 0'
      },
      stepCounter: {
        fontWeight: 700
      },
      baseCard: {
        width: '100%',
        padding: '32px',
        [theme.breakpoints.down('xs')]: {
          marginTop: '15px',
        }
      },
      introText: {
        fontSize: '45px',
        lineHeight: '56px',
        fontWeight: 700,
        marginTop: '1rem',
        marginBottom: '1rem'
      },
      introSubText: {
        marginTop: '1rem',
        marginBottom: '1rem',
      },
      containerAll: {
        background: '#efefef',
        padding: '24px 20px 156px',
        marginTop: '80px',
        width: '100%'
      },
      input: {
        borderRadius: 8,
        padding: '4px',
        width: '100%',
        marginBottom: '30px',
        '& > div:before': {
          borderBottom: 0
        },
        '& > div:after': {
          borderBottom: 0
        },
        '& > label': {
          marginLeft: 10,
        },

        '& > label:not(.MuiInputLabel-shrink)': {
          transform: 'translate(0, 18px) scale(1)'
        },
        '& > div:hover:not(.Mui-disabled):before': {
          borderBottom: 0
        },
        '& > div:active:not(.Mui-disabled):before': {
          borderBottom: 0
        },
        [theme.breakpoints.down('xs')]: {
          width: 'auto'
        }
      },
      buttonContainer: {
        textAlign: 'right',
        display: 'flex',
        justifyContent: 'space-between',
        '& button': {
          fontWeight: 'bold'
        },
        [theme.breakpoints.down('xs')]: {
          flexDirection: 'column',
          '& button': {
            width: '100%',
            marginBottom: '20px'
          }
        }
      },
      startOverContainer: {},
      retryContainer: {
        textAlign: 'center'
      },
      actionContainer: {
        flex: 3,
        display: 'flex',
        justifyContent: 'flex-end',
        [theme.breakpoints.down('xs')]: {
          flexDirection: 'column-reverse'
        }
      },
      backContainer: {
        flex: 1,
        textAlign: 'left'
      },
      actionStartOver: {
        backgroundColor: '#E85757',
        color: '#fff',
        textTransform: 'capitalize',
        fontWeight: 'bold',
        '&:hover': {
          backgroundColor: '#ec7676'
        }
      },
      actionPrimary: {
        width: 200,
        backgroundColor: '#2D9CDB',
        color: 'white',
        textTransform: 'unset',
        marginRight: '20px',
        '&:hover': {
          backgroundColor: '#2D9CDB'
        },
        '&:disabled': {
          color: 'black',
          backgroundColor: '#ecf0f1'
        }
      },
      actionSecondary: {
        backgroundColor: '#e0e0e0',
        textTransform: 'unset',
        marginRight: '20px',
        '&:hover': {
          backgroundColor: '#e0e0e0'
        }
      },
      actionSkip: {
        textTransform: 'unset',
        marginRight: '20px',

      },
      borderBottom: {
        borderBottom: '1px solid transparent',
        margin: '10px 0',
        width: '100%',
      },
      dateContainer: {
        width: '330px',
        [theme.breakpoints.down('xs')]: {
          width: 'auto'
        }
      },
      spacer: {
        marginTop: '30px'
      },
      linkContainer: {
        marginTop: '30px'
      },
      buttonClass: {
        marginBottom: '15px',
        borderRadius: 4,
        border: 'none',
        textTransform: 'capitalize',
        backgroundColor: '#ecf0f1'
      },
      marginBottom: {
        marginBottom: '20px'
      },
      stepDefault: {
        maxWidth: '725px'
      },

      maxBudgetUnit: {
        backgroundColor: '#ecf0f1'
      },
    };
  }
);

function WizardStylesProvider(props) {
  const { children } = props;
  const theme = useTheme();
  const classes = wizardStyles(theme);

  return (
    <WizardStylesContext.Provider value={classes}>
      {children}
    </WizardStylesContext.Provider>
  );
}

export { WizardStylesContext, WizardStylesProvider };