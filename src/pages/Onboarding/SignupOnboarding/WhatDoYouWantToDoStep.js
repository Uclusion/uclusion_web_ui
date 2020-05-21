import React from 'react';
import PropTypes from 'prop-types';
import { Typography, Button, ButtonGroup } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

function WhatDoYouWantToDoStep(props) {
  const { setWizardToShow, active } = props;
  const intl = useIntl();
  const history = useHistory();

  if (!active) {
    return React.Fragment;
  }

  return (
    <div>
      <Typography>
        Uclusion is a powerful tool that can help you collaborate better with your team.
        To start off, we can help you with the following:
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

      <Typography>
        OR
      </Typography>
      <Button
        onClick={() => navigate(history, '/')}
      >
        {intl.formatMessage({ id: 'OnboardingWizardSkipOnboarding'})}
      </Button>
      <Button>

      </Button>
    </div>
  )
}

WhatDoYouWantToDoStep.propTypes = {
  active: PropTypes.bool.isRequired,
}

export default WhatDoYouWantToDoStep;