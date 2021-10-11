import React from 'react'
import PropTypes from 'prop-types'
import WorkspaceNameStep from './WorkspaceNameStep'
import { WizardStylesProvider } from '../../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import AdvancedOptionsStep from './AdvancedOptionsStep';
import SwimlanesOptionsStep from './SwimlanesOptionsStep'
import ApprovalOptionsStep from './ApprovalOptionsStep'
import BudgetOptionsStep from './BudgetOptionsStep'

function StoryWorkspaceWizard(props) {
  const { onStartOver, onFinish, parentInvestibleId, parentMarketId, showCancel } = props;
  if (!showCancel) {
    return (
      <WizardStylesProvider>
        <FormdataWizard name="story_workspace_wizard"
                        onFinish={onFinish}
                        onStartOver={onStartOver}
        >
          <WorkspaceNameStep parentInvestibleId={parentInvestibleId} parentMarketId={parentMarketId} isNew={true} />
        </FormdataWizard>
      </WizardStylesProvider>
    );
  }
  return (
      <WizardStylesProvider>
        <FormdataWizard name="story_workspace_wizard"
                        onFinish={onFinish}
                        onStartOver={onStartOver}
        >
          <WorkspaceNameStep parentInvestibleId={parentInvestibleId} parentMarketId={parentMarketId} />
          <AdvancedOptionsStep />
          <SwimlanesOptionsStep />
          <ApprovalOptionsStep/>
          <BudgetOptionsStep/>
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

