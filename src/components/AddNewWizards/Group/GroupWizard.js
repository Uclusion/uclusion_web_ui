import React from 'react'
import PropTypes from 'prop-types'
import GroupNameStep from './GroupNameStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import ApprovalOptionsStep from './ApprovalOptionsStep'
import GroupMembersStep from './GroupMemberStep'
import { useHistory } from 'react-router';
import { navigate } from '../../../utils/marketIdPathFunctions';

function GroupWizard(props) {
  const {marketId } = props;
  const history = useHistory();

  const onFinish = (formData) => {
    const {link} = formData;
    navigate(history, link);
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name="group_wizard" onFinish={onFinish}>
        <GroupNameStep marketId={marketId}/>
        <GroupMembersStep marketId={marketId}/>
        <ApprovalOptionsStep marketId={marketId}/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

GroupWizard.propTypes = {
  marketId: PropTypes.string.isRequired,
};


export default GroupWizard;

