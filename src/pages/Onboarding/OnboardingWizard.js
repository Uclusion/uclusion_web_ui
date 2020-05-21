import React, { useReducer, useState } from 'react';
import PropTypes from 'prop-types';
import clsx from 'clsx';
import { Card, Container, makeStyles, Typography } from '@material-ui/core';
import Screen from '../../containers/Screen/Screen';
import { useIntl } from 'react-intl';
import { reducer, resetValues } from './onboardingReducer';
import { Helmet } from 'react-helmet';
import Header from '../../containers/Header';


const useStyles = makeStyles(
  theme => {
    return {
      normal: {},
      hidden: {
        display: 'none',
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
      },
      introText: {
        marginTop: '1rem'
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
      },
      buttonContainer: {
        textAlign: 'right',
        display: 'flex',
        justifyContent: 'space-between',
        '& button': {
          fontWeight: 'bold'
        }
      },
      startOverContainer: {},
      actionContainer: {
        flex: 3,
        display: 'flex',
        justifyContent: 'flex-end'
      },
      backContainer: {
        flex: 1,
        textAlign: 'left'
      },
      actionStartOver: {
        backgroundColor: '#E85757',
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
        borderBottom: '1px solid #f2f2f2',
        margin: '30px 0',
        width: '100%'
      },
      dateContainer: {
        width: '330px'
      },
      spacer: {
        marginTop: '30px'
      },
      linkContainer: {
        marginTop: '30px'
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
      }
    };
  }
);

function OnboardingWizard (props) {
  const { hidden, stepPrototypes, title, hideSteppers, onStartOver, onFinish, hideUI } = props;
  const classes = useStyles();

  const [formData, updateFormData] = useReducer(reducer, {});
  // setter passed through to a step to allow it to completely take over the wizard UI
  const [overrideUIContent, setOverrideUIContent] = useState(false);
  const intl = useIntl();
  const initialStepState = {
    currentStep: 0,
    totalSteps: stepPrototypes.length,
  };

  const [stepState, setStepState] = useState(initialStepState);

  function myOnStartOver () {
    // zero all form data
    updateFormData({});
    // reset the step state
    setStepState(initialStepState);
    onStartOver();
  }

  function myOnFinish(formData) {
    onFinish(formData);
    updateFormData(resetValues());
    // reset the step state
    setStepState(initialStepState);
  }

  function nextStep () {
    setStepState({
      ...stepState,
      currentStep: stepState.currentStep + 1,
    });
  }

  function previousStep () {
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
      onStartOver: myOnStartOver,
      active: true,
      onFinish: myOnFinish,
      setOverrideUIContent,
      classes
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

  function getContent () {
    return (
      <Card className={clsx(classes[stepClass], classes.baseCard)} elevation={0} raised={false}>
        <div>
          {getStepHeaders()}
        </div>
        <div>
          {currentStep}
        </div>
      </Card>);
  }

  console.log(formData);

 // if overrideUI content is step, turn the entirety of the ui over to the step
  if (overrideUIContent) {
    return currentStep;
  }

  // If hide UI is on, then we need to renders something to replace the main app
  // layout, with just our content inside it
  if (hideUI) {
    return (

      <div className={hidden ? classes.hidden : classes.normal}>
        <Helmet
          defer={false}
        >
          <title>{title}</title>
        </Helmet>
        <Header
          title={intl.formatMessage({ id: 'OnboardingWizardTitle'})}
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
    >
      {getContent()}
    </Screen>
  );
}

OnboardingWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
  title: PropTypes.string.isRequired,
  stepPrototypes: PropTypes.array,
  hideSteppers: PropTypes.bool,
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  hideUI: PropTypes.bool,
};

OnboardingWizard.defaultProps = {
  stepPrototypes: [],
  hideSteppers: false,
  onStartOver: () => {},
  onFinish: () => {},
  hideUI: true,
};

export default OnboardingWizard;