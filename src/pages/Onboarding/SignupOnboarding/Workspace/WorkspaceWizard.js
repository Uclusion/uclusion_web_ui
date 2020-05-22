import React from 'react';
import PropTypes from 'prop-types';
import WorkspaceNameStep from './WorkspaceNameStep';
import CurrentStoryStep from './CurrentStoryStep';
import CurrentStoryProgressStep from './CurrentStoryProgressStep';
import NextStoryStep from './NextStoryStep';
import CreatingWorkspaceStep from './CreatingWorkspaceStep';
import OnboardingWizard from '../../OnboardingWizard';
import { useIntl } from 'react-intl';
function WorkspaceWizard(props) {
  const { hidden, onStartOver } = props;
  const intl = useIntl();

  const stepPrototypes = [
    {
      label: 'WorkspaceWizardMeetingStepLabel',
      content: <WorkspaceNameStep />,
    },
    {
      label: 'OnboardingWizardCurrentStoryStepLabel',
      content: <CurrentStoryStep/>,
    },
    {
      label: 'OnboardingWizardCurrentStoryProgressStepLabel',
      content: <CurrentStoryProgressStep/>,
    },
    {
      label: 'OnboardingWizardNextStoryStepLabel',
      content: <NextStoryStep />,
    },
    {
      label: 'WorkspaceWizardCreatingWorkspaceStepLabel',
      content: <CreatingWorkspaceStep/>,
    },
  ];

  return (
    <OnboardingWizard
      title={intl.formatMessage({ id: 'WorkspaceWizardTitle' })}
      hidden={hidden}
      onStartOver={onStartOver}
      stepPrototypes={stepPrototypes}
    />
  );
}

WorkspaceWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
  onStartOver: PropTypes.func,
};

WorkspaceWizard.defaultProps = {
  onStartOver: () => {},
}

export default WorkspaceWizard;

