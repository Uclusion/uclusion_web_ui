import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import config from '../../../config';
import { AccountContext } from '../../../contexts/AccountContext/AccountContext';

function WorkspaceIntegrationsStep(props) {
  const { formData } = props;
  const [userState] = useContext(AccountContext) || {};
  const { user } = userState;
  const classes = useContext(WizardStylesContext);

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText} variant="h6">
        Do you want this workspace integrated with Slack?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        Use Add to Slack below to allow the /uclusion command to associate a channel with groups in this workspace.
      </Typography>
      <a
        href={`${config.add_to_slack_url}&state=${user?.id}_${formData.marketId}`}
        target="_blank"
        rel="noopener noreferrer"
      >
        <img
          alt="Add to Slack"
          height="40"
          width="139"
          src="https://platform.slack-edge.com/img/add_to_slack.png"
          srcSet="https://platform.slack-edge.com/img/add_to_slack.png 1x, https://platform.slack-edge.com/img/add_to_slack@2x.png 2x"
        />
      </a>
      <div className={classes.borderBottom} />
      <WizardStepButtons {...props} showNext={false} showSkip />
    </div>
    </WizardStepContainer>
  );
}

WorkspaceIntegrationsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

WorkspaceIntegrationsStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default WorkspaceIntegrationsStep;