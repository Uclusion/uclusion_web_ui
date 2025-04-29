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
  const teamGroups = groupsState[marketId].filter((group) => {
    const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId,
      group.id) || [];
    return !_.isEmpty(groupPresences) && !isAutonomousGroup(groupPresences, group);
  });
  const allAutonomousViews = _.isEmpty(teamGroups);

  const onFinish = () => {
    navigate(history, formMarketLink(marketId, marketId));
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name="collaborator_wizard" onFinish={onFinish} useLocalStorage={false}
                      defaultFormData={{groupIdIndex: 0}}>
        {(allAutonomousViews || viewCreated) && (
          <CreateTeamViewStep marketId={marketId} setViewCreated={setViewCreated} />
        )}
        <InviteByEmailStep marketId={marketId} displayFromOther={displayFromOther} />
        {displayFromOther && (
          <FromOtherWorkspacesStep marketId={marketId} participants={participants}/>
        )}
        <AssignViewsStep marketId={marketId} marketPresences={marketPresences}/>
      </FormdataWizard>
    </WizardStylesProvider>
  )
}

CollaboratorWizard.propTypes = {
  onboarding: PropTypes.bool,
  onFinish: PropTypes.func,
  onStartOnboarding: PropTypes.func,
}

CollaboratorWizard.defaultProps = {
  onboarding: false,
  onFinish: () => {},
  onStartOnboarding: () => {},
}

export default CollaboratorWizard

