import React from 'react'
import PropTypes from 'prop-types'
import WorkspaceNameStep from './WorkspaceNameStep'
import CurrentStoryStep from './CurrentStoryStep'
import CurrentStoryProgressStep from './CurrentStoryProgressStep'
import NextStoryStep from './NextStoryStep'
import { WizardStylesProvider } from '../../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';

function StoryWorkspaceWizard(props) {
  const { onStartOver, onFinish } = props;

  return (
      <WizardStylesProvider>
        <FormdataWizard name="story_workspace_wizard"
                        onFinish={onFinish}
                        onStartOver={onStartOver}
        >
          <WorkspaceNameStep />
          <CurrentStoryStep />
          <CurrentStoryProgressStep/>
          <NextStoryStep />
        </FormdataWizard>
      </WizardStylesProvider>
  );
}

StoryWorkspaceWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
};

StoryWorkspaceWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
}

export default StoryWorkspaceWizard;

