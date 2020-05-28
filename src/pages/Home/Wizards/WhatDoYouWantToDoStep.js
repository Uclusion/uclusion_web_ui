import React from 'react'
import PropTypes from 'prop-types'
import { Button, ButtonGroup, makeStyles } from '@material-ui/core'
import { useIntl } from 'react-intl'
import StepButtons from '../../Onboarding/StepButtons';

const useStyles = makeStyles(
  theme => {
    return {
      buttonContainer: {
        width: '35rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: '3rem',
        display: 'flex',
        [theme.breakpoints.down("xs")]: {
          width: '12rem',
        }
      },
      buttonClass: {
        marginBottom: '15px',
        borderRadius: 4,
        border: 'none',
        textTransform: 'capitalize',
        backgroundColor: '#ecf0f1',
        '&.MuiButtonGroup-groupedOutlinedVertical:not(:last-child)': {
          borderBottom: 'none',
          borderRadius: 4,
        }
      },
      borderBottom: {
        borderBottom: '1px solid transparent',
        margin: '30px 0',
        width: '100%'
      },
    }
  }
);
function WhatDoYouWantToDoStep(props) {
  const { setWizardToShow, active, onCancel } = props;
  const intl = useIntl();
  const classes = useStyles();
  if (!active) {
    return React.Fragment;
  }

  return (
    <div>
        <ButtonGroup
          orientation="vertical"
          className={classes.buttonContainer}
        >
          <Button
          className={classes.buttonClass}
            onClick={() => setWizardToShow('requirementsWorkspace')}
          >
            {intl.formatMessage({ id: 'SignupWizardRequirementsWorkspace'})}
          </Button>
          <Button
          className={classes.buttonClass}
            onClick={() => setWizardToShow('storyWorkspace')}
          >
            {intl.formatMessage({ id: 'SignupWizardStoryWorkspace'})}
          </Button>
          <Button
          className={classes.buttonClass}
            onClick={() => setWizardToShow('dialog')}
          >
            {intl.formatMessage({ id: 'SignupWizardDialog'})}
          </Button>
          <Button
          className={classes.buttonClass}
            onClick={() => setWizardToShow('initiative')}
          >
            {intl.formatMessage({ id: 'SignupWizardInitiative'})}
          </Button>
        </ButtonGroup>
      <div className={classes.borderBottom}></div>
      <StepButtons {...props}
                   validForm={false}
                   showStartOver
                   showGoBack={false}
                   showSkip={false}
                   showNext={false}
                   showFinish={false}
                   startOverLabel="cancel"
                   onStartOver={onCancel}/>
    </div>
  )
}

WhatDoYouWantToDoStep.propTypes = {
  active: PropTypes.bool,
  onCancel: PropTypes.func,
}

WhatDoYouWantToDoStep.defaultProps = {
  active: false,
  onCancel: () => {},
}

export default WhatDoYouWantToDoStep;