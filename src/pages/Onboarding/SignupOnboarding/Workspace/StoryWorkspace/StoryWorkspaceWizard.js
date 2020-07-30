import React from 'react'
import PropTypes from 'prop-types'
import WorkspaceNameStep from './WorkspaceNameStep'
import CurrentStoryStep from './CurrentStoryStep'
import CurrentStoryProgressStep from './CurrentStoryProgressStep'
import NextStoryStep from './NextStoryStep'
import CreatingWorkspaceStep from './CreatingWorkspaceStep'
import OnboardingWizard from '../../../OnboardingWizard'
import { useIntl } from 'react-intl'
import HelpMovie from '../../../../../components/ModalMovie/HelpMovie';
import Screen from '../../../../../containers/Screen/Screen';

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
    {
      label: 'WorkspaceWizardCreatingWorkspaceStepLabel',
      content: <CreatingWorkspaceStep/>,
    },
  ];

  return (
    <div>
    {!hidden && (
      <HelpMovie open name="accountSignupHelp" canClose={false}/>
    )}
    <OnboardingWizard
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

