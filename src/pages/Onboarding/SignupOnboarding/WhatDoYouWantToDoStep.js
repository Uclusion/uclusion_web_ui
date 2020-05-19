import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Button, ButtonGroup } from '@material-ui/core';
import { useIntl } from 'react-intl';

function WhatDoYouWantToDoStep(props) {
  const { setWizardToShow, active } = props;
  const intl = useIntl();

  if (!active) {
    return React.Fragment;
  }

  return (
    <div>
      <Typography>
        Uclusion is a powerful tool that can help you collaborate better with your team.
        To get you started, what process do you most want to improve?
      </Typography>
        <ButtonGroup
          orientation="vertical"
        >
          <Button
            onClick={() => setWizardToShow('workspace')}
          >
            {intl.formatMessage({ id: 'SignupWizardWorkspace'})}
          </Button>
          <Button
            onClick={() => setWizardToShow('dialog')}
          >
            {intl.formatMessage({ id: 'SignupWizardDialog'})}
          </Button>
          <Button
            onClick={() => setWizardToShow('initiative')}
          >
            {intl.formatMessage({ id: 'SignupWizardInitiative'})}
          </Button>
        </ButtonGroup>
    </div>
  )
}

WhatDoYouWantToDoStep.propTypes = {
  active: PropTypes.bool.isRequired,
}

export default WhatDoYouWantToDoStep;