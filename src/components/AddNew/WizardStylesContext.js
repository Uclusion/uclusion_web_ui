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
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '32px',
        [theme.breakpoints.down('xs')]: {
          marginTop: '15px',
        }
      },
      introText: {
        marginTop: '1rem',
        marginBottom: '1rem'
      },
      inputLabel: {
        display: 'block',
        marginTop: '2rem',
        fontWeight: 'bold',
        textTransform: 'capitalize'
      },
      containerAll: {
        background: '#efefef',
        padding: '24px 20px 156px',
        marginTop: '80px',
        width: '100%'
      },
      input: {
        backgroundColor: '#ecf0f1',
        border: 0,
        borderRadius: 8,
        padding: '4px',
        width: '350px',
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
        '& > label.Mui-focused': {
          color: 'black'
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
          flexDirection: 'column-reverse',
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
        backgroundColor: '#2D9CDB',
        color: 'white',
        textTransform: 'unset',
        marginRight: '20px',
        '&:hover': {
          backgroundColor: '#2D9CDB'
        },
        '&:disabled': {
          color: 'white',
          backgroundColor: 'rgba(45, 156, 219, .6)'
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
        backgroundColor: '#fff',
        textTransform: 'unset',
        marginRight: '20px',
        '&:hover': {
          backgroundColor: '#fff'
        }
      },
      borderBottom: {
        borderBottom: '1px solid transparent',
        margin: '30px 0',
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
      WorkspaceWizardMeetingStepLabel: {
        maxWidth: '500px'
      },
      OnboardingWizardCurrentStoryStepLabel: {
        maxWidth: '725px'
      },
      OnboardingWizardCurrentStoryProgressStepLabel: {
        maxWidth: '725px',
        overflow: 'visible'
      },
      OnboardingWizardNextStoryStepLabel: {
        maxWidth: '725px'
      },
      OnboardingWizardAdvancedOptionsStepLabel: {
        maxWidth: '725px'
      },
      WorkspaceWizardCreatingWorkspaceStepLabel: {
        maxWidth: '500px'
      },
      ReqWorkspaceWizardNameStepLabel: {
        maxWidth: '500px'
      },
      ReqWorkspaceWizardRequirementsStepLabel: {
        maxWidth: '725px'
      },
      DialogWizardDialogNameStepLabel: {
        maxWidth: '500px'
      },
      DialogWizardDialogReasonStepLabel: {
        maxWidth: '725px'
      },
      DialogWizardDialogExpirationStepLabel: {
        maxWidth: '725px'
      },
      DialogWizardMultipleVotesStepLabel: {
        maxWidth: '725px'
      },
      DialogWizardAddOptionsStepLabel: {
        maxWidth: '500px'
      },
      AddOptionWizardOptionNameStepLabel: {
        maxWidth: '500px'
      },
      AddOptionWizardOptionDescriptionStepLabel: {
        maxWidth: '725px'
      },
      DialogWizardCreatingDialogStepLabel: {
        maxWidth: '500px'
      },
      InitiativeWizardInitiativeNameStepLabel: {
        maxWidth: '500px'
      },
      InitiativeWizardInitiativeDescriptionStepLabel: {
        maxWidth: '725px'
      },
      InitiativeWizardInitiativeExpirationStepLabel: {
        maxWidth: '725px'
      },
      InitiativeWizardRestrictStepLabel: {
        maxWidth: '725px',
      },
      InitiativeWizardCreatingInitiativeStepLabel: {
        maxWidth: '725px'
      },
      ReqWorkspaceWizardTodoStepLabel: {
        maxWidth: '725px'
      },
      ReqWorkspaceWizardCreatingworkspaceStepLabel: {
        maxWidth: '500px'
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