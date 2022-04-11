import React from 'react'
import PropTypes from 'prop-types'
import WorkspaceNameStep from './WorkspaceNameStep'
import { WizardStylesProvider } from '../../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';

function StoryWorkspaceWizard(props) {
  const { onStartOver, onFinish, parentInvestibleId, parentMarketId } = props;
  return (
    <WizardStylesProvider>
      <FormdataWizard name="story_workspace_wizard"
                      onFinish={onFinish}
                      onStartOver={onStartOver}
      >
        <WorkspaceNameStep parentInvestibleId={parentInvestibleId} parentMarketId={parentMarketId}
                           hideSteppers={true} />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

StoryWorkspaceWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

StoryWorkspaceWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default StoryWorkspaceWizard;

