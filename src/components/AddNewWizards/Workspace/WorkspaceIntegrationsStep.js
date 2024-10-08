import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import config from '../../../config';
import { AccountContext } from '../../../contexts/AccountContext/AccountContext';
import Link from '@material-ui/core/Link';

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
        Use Add to Slack button below
        to <Link href="https://documentation.uclusion.com/notifications/slack" target="_blank">integrate this workspace</Link>.
        Hit the next button when done or to skip integration.
      </Typography>
      <a
        href={`${config.add_to_slack_url}&state=${user?.id}_${formData.marketId}`}
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
      <WizardStepButtons {...props} showNext />
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