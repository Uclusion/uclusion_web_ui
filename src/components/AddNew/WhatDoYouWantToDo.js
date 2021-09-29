import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  FormControl,
  FormControlLabel,
  makeStyles,
  Radio,
  RadioGroup,
  Typography,
  useTheme
} from '@material-ui/core'
import { useIntl } from 'react-intl';
import { WizardStylesContext } from './WizardStylesContext'
import SpinningButton from '../SpinBlocking/SpinningButton'

const useStyles = makeStyles(
  theme => {
    return {
      myCard: {
        maxWidth: '725px',
        marginLeft: 'auto',
        marginRight: 'auto',
        padding: '32px',
        [theme.breakpoints.down('xs')]: {
          marginTop: '15px',
        }
      },
      buttonContainer: {
        marginLeft: 'auto',
        marginRight: 'auto',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
      },
      buttonClassLarge: {
        marginLeft: 'auto',
        width: '35rem',
        marginTop: '2rem',
        marginBottom: '2rem',
        borderRadius: 4,
        border: 'none',
        textTransform: 'capitalize',
        backgroundColor: '#ecf0f1',
        '&.MuiButtonGroup-groupedOutlinedVertical:not(:last-child)': {
          borderBottom: 'none',
          borderRadius: 4,
        },
        '&:hover': {
          border: '1px solid'
        },
        [theme.breakpoints.down('xs')]: {
          width: '16rem',
        }
      },
      buttonClass: {
        marginBottom: '15px',
        borderRadius: 4,
        width: '35rem',
        border: 'none',
        textTransform: 'capitalize',
        backgroundColor: '#ecf0f1',
        '&.MuiButtonGroup-groupedOutlinedVertical:not(:last-child)': {
          borderBottom: 'none',
          borderRadius: 4,
        },
        '&:hover': {
          border: '1px solid'
        },
        [theme.breakpoints.down('xs')]: {
          width: '16rem',
        }
      },
      borderBottom: {
        borderBottom: '1px solid transparent',
        margin: '30px 0',
        width: '100%'
      },
    };
  }
);

function WhatDoYouWantToDo (props) {
  const { setWizardToShow, onStartOver, showCancel } = props;
  const intl = useIntl();
  const theme = useTheme();
  const classes = useStyles(theme);
  const [wizard, setWizard] = useState('storyWorkspace');
  const wizardClasses = useContext(WizardStylesContext);

  function handleChange(event) {
    setWizard(event.target.value);
  }

  return (
    <Card className={classes.myCard} elevation={3}>
      <Typography variant="h5" style={{paddingBottom: '1rem'}}>
        {intl.formatMessage({ id: 'SignupWizardTitle' })}
      </Typography>
      <FormControl component="fieldset" className={classes.buttonContainer}>
        <RadioGroup
          aria-labelledby="comment-type-choice"
          onChange={handleChange}
          value={wizard}
        >
          <FormControlLabel value="storyWorkspace" control={<Radio />}
                            label={intl.formatMessage({ id: 'SignupWizardStoryWorkspace' })} />
          <FormControlLabel value="dialog" control={<Radio />}
                            label={intl.formatMessage({ id: 'SignupWizardDialog' })} />
          <FormControlLabel value="initiative" control={<Radio />}
                            label={intl.formatMessage({ id: 'SignupWizardInitiative' })} />
        </RadioGroup>
      </FormControl>
      <div className={wizardClasses.borderBottom} />
      <div className={wizardClasses.buttonContainer}>
        {showCancel && (
          <div>
            <Button className={wizardClasses.actionStartOver}
                    onClick={() => onStartOver()}>{intl.formatMessage({ id: 'OnboardingWizardStartOver' })}
            </Button>
          </div>
        )}
        <div className={wizardClasses.actionContainer}>
          <SpinningButton doSpin={false} className={wizardClasses.actionPrimary}
                          onClick={() => setWizardToShow(wizard)}>
            {intl.formatMessage({ id: 'OnboardingWizardContinue' })}
          </SpinningButton>
        </div>
      </div>
    </Card>
  );
}

WhatDoYouWantToDo.propTypes = {
  active: PropTypes.bool,
};

WhatDoYouWantToDo.defaultProps = {
  active: false,
};

export default WhatDoYouWantToDo;