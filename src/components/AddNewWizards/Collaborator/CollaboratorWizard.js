import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types'
import { WizardStylesProvider } from '../WizardStylesContext'
import FormdataWizard from 'react-formdata-wizard'
import { extractUsersList } from '../../../utils/userFunctions';
import {
  getGroupPresences,
  getMarketPresences,
  isAutonomousGroup
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import _ from 'lodash'
import FromOtherWorkspacesStep from './FromOtherWorkspacesStep';
import InviteByEmailStep from './InviteByEmailStep';
import AssignViewsStep from './AssignViewsStep';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import CreateTeamViewStep from './CreateTeamViewStep';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { DEMO_TYPE } from '../../../constants/markets';

function CollaboratorWizard (props) {
  const { marketId } = props;
  const history = useHistory();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketState] = useContext(MarketsContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [viewCreated, setViewCreated] = useState(false);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const participants = Object.values(extractUsersList(marketPresencesState, marketState, marketPresences));
  const displayFromOther = !_.isEmpty(participants);
  const market = getMarket(marketState, marketId) || {};
  const isDemoMarket = market.object_type === DEMO_TYPE;
  const teamGroups = groupsState[marketId]?.filter((group) => {
    const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId,
      group.id) || [];
    return !_.isEmpty(groupPresences) && !isAutonomousGroup(groupPresences, group);
  });
  const allAutonomousViews = _.isEmpty(teamGroups);

  const onFinish = () => {
    navigate(history, formMarketLink(marketId, marketId));
  }

  // Have to do create team view step first or they won't see that at all if they copy the market link

  return (
    <WizardStylesProvider>
      <FormdataWizard name="collaborator_wizard" onFinish={onFinish} useLocalStorage={false}
                      defaultFormData={{groupIdIndex: 0}}>
        {(allAutonomousViews || viewCreated) && (
          <CreateTeamViewStep marketId={marketId} setViewCreated={setViewCreated} />
        )}
        <InviteByEmailStep marketId={marketId} displayFromOther={displayFromOther} allAutonomousViews={allAutonomousViews} isDemoMarket={isDemoMarket} />
        {displayFromOther && (
          <FromOtherWorkspacesStep marketId={marketId} participants={participants} allAutonomousViews={allAutonomousViews} />
        )}
        <AssignViewsStep marketId={marketId} marketPresences={marketPresences}/>
      </FormdataWizard>
    </WizardStylesProvider>
  )
}

export default CollaboratorWizard

