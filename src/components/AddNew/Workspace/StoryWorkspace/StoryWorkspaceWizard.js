import React from 'react'
import PropTypes from 'prop-types'
import WorkspaceNameStep from './WorkspaceNameStep'
import { WizardStylesProvider } from '../../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import AdvancedOptionsStep from './AdvancedOptionsStep';
import SwimlanesOptionsStep from './SwimlanesOptionsStep'
import ApprovalOptionsStep from './ApprovalOptionsStep'

function StoryWorkspaceWizard(props) {
  const { onStartOver, onFinish, parentInvestibleId, parentMarketId } = props;

  return (
      <WizardStylesProvider>
        <FormdataWizard name="story_workspace_wizard"
                        onFinish={onFinish}
                        onStartOver={onStartOver}
        >
          <WorkspaceNameStep parentInvestibleId={parentInvestibleId} parentMarketId={parentMarketId} />
          <AdvancedOptionsStep />
          <SwimlanesOptionsStep />
          <ApprovalOptionsStep />
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

