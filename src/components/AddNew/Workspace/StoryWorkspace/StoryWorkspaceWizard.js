import React from 'react'
import PropTypes from 'prop-types'
import WorkspaceNameStep from './WorkspaceNameStep'
import CurrentStoryStep from './CurrentStoryStep'
import CurrentStoryProgressStep from './CurrentStoryProgressStep'
import NextStoryStep from './NextStoryStep'
import CreationWizard from '../../CreationWizard'
import { useIntl } from 'react-intl'
import HelpMovie from '../../../ModalMovie/HelpMovie'

function StoryWorkspaceWizard(props) {
  const { hidden, onStartOver, isHome, onFinish } = props;
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
  ];

  return (
    <div>
    {!hidden && !isHome && (
      <HelpMovie name="accountSignupHelp"/>
    )}
    <CreationWizard
      title={intl.formatMessage({ id: 'WorkspaceWizardTitle' })}
      isHome={isHome}
      hidden={hidden}
      onFinish={onFinish}
      onStartOver={onStartOver}
      stepPrototypes={stepPrototypes}
    />
    </div>
  );
}

StoryWorkspaceWizard.propTypes = {
  hidden: PropTypes.bool.isRequired,
  onStartOver: PropTypes.func,
  isHome: PropTypes.bool,
  onFinish: PropTypes.func,
};

StoryWorkspaceWizard.defaultProps = {
  onStartOver: () => {},
  isHome: false,
  onFinish: () => {},
}

export default StoryWorkspaceWizard;

