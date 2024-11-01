import React, { useContext } from 'react';
import { Button } from '@material-ui/core';
import { navigate } from '../../utils/marketIdPathFunctions';
import { COMPOSE_WIZARD_TYPE, DEMO_TYPE, PLANNING_TYPE, WORKSPACE_WIZARD_TYPE } from '../../constants/markets';
import { wizardStyles } from '../InboxWizards/WizardStylesContext';
import { useHistory } from 'react-router';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { getInboxCount } from '../../contexts/NotificationsContext/notificationsContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { usePresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import _ from 'lodash';
import { MarketGroupsContext } from '../../contexts/MarketGroupsContext/MarketGroupsContext';

function DemoCreateWorkspaceButton() {
  const wizardClasses = wizardStyles();
  const history = useHistory();
  const [messagesState] = useContext(NotificationsContext);
  const [marketsState] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const { marketDetails } = marketsState;
  const demo = marketDetails?.find((market) => market.market_type === PLANNING_TYPE &&
    market.object_type === DEMO_TYPE) || {};
  const totalCount = getInboxCount(messagesState, demo.id, groupsState, true);
  const presences = usePresences(demo.id);
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const demoMarketComments = getMarketComments(commentsState, demo.id) || [];
  const demoCommentCreated = demoMarketComments.find((comment) => comment.updated_by === myPresence.id);
  const demoMarketInvestibles = getMarketInvestibles(investiblesState, demo.id);
  const demoInvestibleCreated = demoMarketInvestibles.find((investible) =>
    investible.investible.updated_by === myPresence.id);
  const demoGroups = groupsState[demo.id] || [];
  const demoGroupCreated = demoGroups.find((group) => group.updated_by === myPresence.id);

  if (totalCount >= demo.original_notification_count && _.isEmpty(demoCommentCreated) &&
    _.isEmpty(demoInvestibleCreated) && _.isEmpty(demoGroupCreated)) {
    return (
      <Button
        onClick={() => {
          navigate(history, `/wizard#type=${COMPOSE_WIZARD_TYPE.toLowerCase()}&marketId=${demo.id}`);
        }}
        className={wizardClasses.actionNext}
        id="composeFromDemoBanner"
      >
        Create something
      </Button>
    );
  }

  return (
    <Button
      onClick={() => {
        navigate(history, `/wizard#type=${WORKSPACE_WIZARD_TYPE.toLowerCase()}`);
      }}
      className={wizardClasses.actionNext}
      id="workspaceFromDemoBanner"
    >
      Create your workspace
    </Button>
  );
}

export default DemoCreateWorkspaceButton;
