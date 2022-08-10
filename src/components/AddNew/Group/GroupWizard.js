import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import GroupNameStep from './GroupNameStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import AdvancedOptionsStep from './AdvancedOptionsStep';
import SwimlanesOptionsStep from './SwimlanesOptionsStep'
import ApprovalOptionsStep from './ApprovalOptionsStep'
import BudgetOptionsStep from './BudgetOptionsStep'
import GroupMembersStep from './GroupMemberStep'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext'
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext'
import { doCreateGroup } from './groupCreator'
import { formMarketLink } from '../../../utils/marketIdPathFunctions'

function GroupWizard(props) {
  const { onStartOver, onFinish, marketId } = props;
  //TODO remove the finish out of every step and pass correctly into the FormdataWizard the composite with onFinish
  //TODO and then in StepButtons call without arguments so it gets formdata passed to it
  const [, diffDispatch] = useContext(DiffContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, groupMembersDispatch] = useContext(GroupMembersContext);

  function createGroup(formData) {
    const dispatchers = {
      groupsDispatch,
      diffDispatch,
      groupMembersDispatch
    };
    return doCreateGroup(dispatchers, { marketId, ...formData })
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
          <GroupMembersStep marketId={marketId} />
          <AdvancedOptionsStep />
          <SwimlanesOptionsStep />
          <ApprovalOptionsStep/>
          <BudgetOptionsStep/>
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

