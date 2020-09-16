import React from 'react';
import PropTypes from 'prop-types';
import { Button, ButtonGroup, Card, makeStyles, Typography, useTheme } from '@material-ui/core';
import { useIntl } from 'react-intl';

const useStyles = makeStyles(
  theme => {
    return {
      title: {
        margin: '1rem 0'
      },
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
        width: '35rem',
        marginLeft: 'auto',
        marginRight: 'auto',
        marginTop: '3rem',
        display: 'flex',
        [theme.breakpoints.down('xs')]: {
          width: '11rem',
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
    };
  }
);

function WhatDoYouWantToDo (props) {
  const { setWizardToShow } = props;
  const intl = useIntl();
  const theme = useTheme();
  const classes = useStyles(theme);
  return (
    <Card className={classes.myCard} elevation={0} raised={false}>
      <Typography className={classes.title} variant="h4">{intl.formatMessage({ id: 'SignupWizardTitle' })}</Typography>
      <div>
        <ButtonGroup
          orientation="vertical"
          className={classes.buttonContainer}
        >
          <Button
            className={classes.buttonClass}
            onClick={() => setWizardToShow('requirementsWorkspace')}
          >
            {intl.formatMessage({ id: 'SignupWizardRequirementsWorkspace' })}
          </Button>
          <Button
            className={classes.buttonClass}
            onClick={() => setWizardToShow('storyWorkspace')}
          >
            {intl.formatMessage({ id: 'SignupWizardStoryWorkspace' })}
          </Button>
          <Button
            className={classes.buttonClass}
            onClick={() => setWizardToShow('dialog')}
          >
            {intl.formatMessage({ id: 'SignupWizardDialog' })}
          </Button>
          <Button
            className={classes.buttonClass}
            onClick={() => setWizardToShow('initiative')}
          >
            {intl.formatMessage({ id: 'SignupWizardInitiative' })}
          </Button>
        </ButtonGroup>
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