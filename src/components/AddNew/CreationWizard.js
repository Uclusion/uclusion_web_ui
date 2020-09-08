import React, { useEffect, useReducer, useState } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { Card, Container, makeStyles, Typography } from '@material-ui/core'
import Screen from '../../containers/Screen/Screen'
import { useIntl } from 'react-intl'
import { generateReducer, getStoredData, resetValues } from './wizardReducer'
import { Helmet } from 'react-helmet'
import Header from '../../containers/Header'
import _ from 'lodash'

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
        marginTop: '100px',
        padding: '32px',
        [theme.breakpoints.down('xs')]: {
          marginTop: '15px',
        }
      },
      baseCardNew: {
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
        marginRight: '10px',
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
      WorkspaceWizardCreatingWorkspaceStepLabel: {
        maxWidth: '500px'
      },
      SignupWizardTitle: {
        maxWidth: '725px'
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
      InitiativeWizardCreatingInitiativeStepLabel: {
        maxWidth: '725px'
      },
      ReqWorkspaceWizardTodoStepLabel: {
        maxWidth: '725px'
      },
      ReqWorkspaceWizardCreatingworkspaceStepLabel: {
        maxWidth: '500px'
      }
    };
  }
);

function CreationWizard (props) {
  const { hidden, stepPrototypes, title, hideSteppers, onStartOver, onFinish, hideUI, isHome } = props;
  const classes = wizardStyles();
  const reducer = generateReducer(title);
  const initialData = getStoredData(title) || {};
  const [formData, updateFormData] = useReducer(reducer, initialData);
  const [operationStatus, setOperationStatus] = useState({});
  // setter passed through to a step to allow it to completely take over the wizard UI
  const [overrideUIContent, setOverrideUIContent] = useState(false);
  const intl = useIntl();
  const initialStepState = {
    currentStep: 0,
    totalSteps: stepPrototypes.length,
  };

  const [stepState, setStepState] = useState(initialStepState);
  useEffect(() => {
    // if we get hidden, set ourselves back to the start
    if (hidden && (stepState.currentStep !== 0 || !_.isEmpty(formData) || !_.isEmpty(operationStatus))) {
      // not a function because otherwise we'd have to have our own use callback
      updateFormData(resetValues());
      setStepState(initialStepState);
      setOperationStatus({});
    }
  }, [hidden, updateFormData, formData, stepState, initialStepState, setStepState, operationStatus, setOperationStatus]);

  function resetWizard() {
    updateFormData(resetValues());
    // reset the step state
    setStepState(initialStepState);
    setOperationStatus({});
  }

  function myOnStartOver () {
    // zero all form data
    resetWizard();
    onStartOver();
  }

  function myOnFinish (formData) {
    const cloned = formData;
    updateFormData(resetValues());
    onFinish(cloned);
    // reset the step state
    setStepState(initialStepState);
  }

  function nextStep () {
    const nextStep = stepState.currentStep + 1;
    // advance if we have a next step, otherwise ignore
    if (nextStep >= stepPrototypes.length) {
       return;
    }
    setStepState({
      ...stepState,
      currentStep: stepState.currentStep + 1,
    });
  }

  function previousStep () {
    // go back if we're not at the start, otherwise ignore
    if (stepState.currentStep === 0) {
      return;
    }
    setStepState({
      ...stepState,
      currentStep: stepState.currentStep - 1,
    });
  }

  function getStepHeaders () {

    const currentStep = stepPrototypes[stepState.currentStep];
    const stepNumber = stepState.currentStep;
    const stepCount = stepState.totalSteps;
    const { label } = currentStep;

    return (
      <div>
        {!hideSteppers && <Typography className={classes.stepCounter}
                                      variant="caption">Step {(stepNumber + 1)} of {stepCount}</Typography>}
        <Typography className={classes.title} variant="h4">{intl.formatMessage({ id: label })}</Typography>
      </div>
    );
  }

  function getCurrentStepContents () {
    const props = {
      ...stepState,
      formData,
      updateFormData,
      nextStep,
      previousStep,
      operationStatus,
      setOperationStatus,
      onStartOver: myOnStartOver,
      active: true,
      onFinish: myOnFinish,
      setOverrideUIContent,
      classes,
      isHome
    };
    const currentStep = stepPrototypes[stepState.currentStep];
    if (!currentStep) {
      return React.Fragment;
    }
    const { content } = currentStep;
    // because of clone element, individual steps have a hard time storing their own state,
    // so steps should use the form data if they need to store data between
    // executions of the main wizard element
    return React.cloneElement(content, props);
  }

  const stepClass = stepPrototypes[stepState.currentStep].label;
  const currentStep = getCurrentStepContents();
  const baseStyle = isHome ? classes.baseCardNew : classes.baseCard;

  function getContent () {
    return (
      <Card className={clsx(classes[stepClass], baseStyle)} elevation={0} raised={false}>
        <div>
          {getStepHeaders()}
        </div>
        <div>
          {currentStep}
        </div>
      </Card>);
  }

  // if overrideUI content is step, turn the entirety of the ui over to the step
  if (overrideUIContent) {
    return currentStep;
  }

  // If hide UI is on, then we need to renders something to replace the main app
  // layout, with just our content inside it
  if (hideUI) {
    return (

      <div className={hidden ? classes.hidden : classes.normal}>
        {!isHome && (<Helmet
          defer={false}
        >
          <title>{title}</title>
        </Helmet>)}
        <Header
          title={intl.formatMessage({ id: 'OnboardingWizardTitle' })}
          breadCrumbs={[]}
          toolbarButtons={[]}
          hidden={hidden}
          appEnabled
          logoLinkDisabled
          hideTools
        />
        <Container className={classes.containerAll}>{getContent()}</Container>

      </div>);
  }

  return (
    <Screen
      tabTitle={title}
      hidden={hidden}
      isOnboarding
    >
      {getContent()}
    </Screen>
  );
}

CreationWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  stepPrototypes: PropTypes.array,
  hideSteppers: PropTypes.bool,
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  hideUI: PropTypes.bool,
  isHome: PropTypes.bool,
};

CreationWizard.defaultProps = {
  stepPrototypes: [],
  hideSteppers: false,
  onStartOver: () => {},
  onFinish: () => {},
  hideUI: true,
  isHome: false,
};

export default CreationWizard;