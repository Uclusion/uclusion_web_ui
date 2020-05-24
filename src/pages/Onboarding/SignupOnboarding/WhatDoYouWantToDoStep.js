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
        To start off, we can help you with the following:
      </Typography>
        <ButtonGroup
          orientation="vertical"
        >
          <Button
            onClick={() => setWizardToShow('requirementsWorkspace')}
          >
            {intl.formatMessage({ id: 'SignupWizardRequirementsWorkspace'})}
          </Button>
          <Button
            onClick={() => setWizardToShow('storyWorkspace')}
          >
            {intl.formatMessage({ id: 'SignupWizardStoryWorkspace'})}
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
  active: PropTypes.bool,
}

WhatDoYouWantToDoStep.defaultProps = {
  active: false,
}

export default WhatDoYouWantToDoStep;