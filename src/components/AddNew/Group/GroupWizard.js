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
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import _ from 'lodash'

function GroupWizard(props) {
  const { onStartOver, onFinish, marketId } = props;
  const [, diffDispatch] = useContext(DiffContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, groupMembersDispatch] = useContext(GroupMembersContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
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
        {_.size(marketPresences) > 1 && (
          <GroupMembersStep marketId={marketId} />
        )}
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

