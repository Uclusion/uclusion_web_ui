import React from 'react'
import PropTypes from 'prop-types'
import { Button, ButtonGroup, makeStyles, Typography } from '@material-ui/core'
import { useIntl } from 'react-intl'

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
      }
    }
  }
);
function WhatDoYouWantToDoStep(props) {
  const { setWizardToShow, active } = props;
  const intl = useIntl();
  const classes = useStyles();
  if (!active) {
    return React.Fragment;
  }

  return (
    <div>
      <Typography>
        Uclusion is a powerful collaboration tool, create your first workspace to get started.
      </Typography>
        <ButtonGroup
          orientation="vertical"
          className={classes.buttonContainer}
        >
          <Button
          className={classes.buttonClass}
            onClick={() => setWizardToShow('storyWorkspace')}
          >
            {intl.formatMessage({ id: 'SignupWizardFirstWorkspace'})}
          </Button>
        </ButtonGroup>
    </div>
  )
}

WhatDoYouWantToDoStep.propTypes = {
  active: PropTypes.bool,
}

WhatDoYouWantToDoStep.defaultProps = {
  active: false,
}

export default WhatDoYouWantToDoStep;