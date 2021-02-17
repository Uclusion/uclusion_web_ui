import React from 'react';
import PropTypes from 'prop-types';
import { Button, Card, makeStyles, Typography, useTheme } from '@material-ui/core';
import { useIntl } from 'react-intl';

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
  const { setWizardToShow } = props;
  const intl = useIntl();
  const theme = useTheme();
  const classes = useStyles(theme);
  return (
    <Card className={classes.myCard} elevation={0} raised={false}>
      <Typography variant="h5">
        {intl.formatMessage({ id: 'SignupWizardTitle' })}
      </Typography>
      <div
        className={classes.buttonContainer}
      >
        <div>
        <Button
          className={classes.buttonClassLarge}
          onClick={() => setWizardToShow('storyWorkspace')}
        >
          {intl.formatMessage({ id: 'SignupWizardStoryWorkspace' })}
        </Button>
        </div>
        <div>
        <Button
          className={classes.buttonClass}
          onClick={() => setWizardToShow('dialog')}
        >
          {intl.formatMessage({ id: 'SignupWizardDialog' })}
        </Button>
        </div>
        <div>
        <Button
          className={classes.buttonClass}
          onClick={() => setWizardToShow('initiative')}
        >
          {intl.formatMessage({ id: 'SignupWizardInitiative' })}
        </Button>
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