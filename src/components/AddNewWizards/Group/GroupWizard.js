import React from 'react'
import PropTypes from 'prop-types'
import GroupNameStep from './GroupNameStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import ApprovalOptionsStep from './ApprovalOptionsStep'
import GroupMembersStep from './GroupMemberStep'

function GroupWizard(props) {
  const {marketId } = props;


  return (
    <WizardStylesProvider>
      <FormdataWizard name="group_wizard">
        <GroupNameStep marketId={marketId}/>
        <GroupMembersStep marketId={marketId}/>
        <ApprovalOptionsStep marketId={marketId}/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

GroupWizard.propTypes = {
  makerId: PropTypes.string.isRequired,
};


export default GroupWizard;

