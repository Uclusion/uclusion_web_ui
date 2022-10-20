import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import GroupNameStep from './GroupNameStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import ApprovalOptionsStep from './ApprovalOptionsStep'
import GroupMembersStep from './GroupMemberStep'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext'
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext'
import { doCreateGroup } from './groupCreator'
import { formMarketLink } from '../../../utils/marketIdPathFunctions'

function GroupWizard(props) {
  const { onStartOver, onFinish, marketId } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, groupMembersDispatch] = useContext(GroupMembersContext);

  function createGroup(formData) {
    const dispatchers = {
      groupsDispatch,
      diffDispatch,
      groupMembersDispatch
    };
    // default things not filled in
    const groupData = {
      ...formData,
      marketId,
      votesRequired: formData.votesRequired ?? 0,
    };


    return doCreateGroup(dispatchers, groupData)
      .then((group) => {
        return onFinish({ ...formData, link: formMarketLink(group.market_id, group.id) });
      })
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name="group_wizard"
                      onFinish={createGroup}
                      onStartOver={onStartOver}
      >
        <GroupNameStep />
        <GroupMembersStep />
        <ApprovalOptionsStep/>
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

GroupWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

GroupWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default GroupWizard;

