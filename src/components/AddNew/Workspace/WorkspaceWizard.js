import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import WorkspaceNameStep from './WorkspaceNameStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import WorkspaceMembersStep from './WorkspaceMemberStep'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext'
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext'
import { doCreateGroup } from './workspaceCreator'
import { formMarketLink } from '../../../utils/marketIdPathFunctions'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import _ from 'lodash'

function WorkspaceWizard(props) {
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
      <FormdataWizard name="workspace_wizard"
                      onFinish={createGroup}
                      onStartOver={onStartOver}
      >
        <WorkspaceNameStep />
        <WorkspaceMembersStep />
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

WorkspaceWizard.propTypes = {
  onStartOver: PropTypes.func,
  onFinish: PropTypes.func,
  showCancel: PropTypes.bool
};

WorkspaceWizard.defaultProps = {
  onStartOver: () => {},
  onFinish: () => {},
  showCancel: true
}

export default WorkspaceWizard;

