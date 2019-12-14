import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import _ from 'lodash';
import Screen from '../../containers/Screen/Screen';
import {
  makeBreadCrumbs,
  formMarketLink,
  decomposeMarketPath,
} from '../../utils/marketIdPathFunctions';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getInvestible, getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket, getMyUserForMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import DecisionInvestible from './Decision/DecisionInvestible';
import DecisionInvestibleEdit from './Decision/DecisionInvestibleEdit';
import { lockInvestibleForEdit, realeaseInvestibleEditLock } from '../../api/investibles';
import PlanningInvestible from './Planning/PlanningInvestible';
import PlanningInvestibleEdit from './Planning/PlanningInvestibleEdit';
import { DECISION_TYPE, PLANNING_TYPE } from '../../constants/markets';
import InitiativeInvestible from './Initiative/InitiativeInvestible';
import InitiativeInvestibleEdit from './Initiative/InitiativeInvestibleEdit';

const emptyInvestible = { investible: { name: '', description: '' } };
const emptyMarket = { name: '' };

function createCommentsHash(commentsArray) {
  return _.keyBy(commentsArray, 'id');
}

function Investible(props) {
  const { hidden } = props;
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId, investibleId } = decomposeMarketPath(pathname);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const [marketsState] = useContext(MarketsContext);
  const market = getMarket(marketsState, marketId) || emptyMarket;
  const user = getMyUserForMarket(marketsState, marketId) || {};
  const userId = user.id;
  const [commentsState] = useContext(CommentsContext);
  const comments = getMarketComments(commentsState, marketId);
  const investibleComments = comments.filter((comment) => comment.investible_id === investibleId);
  const commentsHash = createCommentsHash(investibleComments);
  const [investiblesState] = useContext(InvestiblesContext);
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const inv = getInvestible(investiblesState, investibleId);
  const usedInv = inv || emptyInvestible;
  const { investible } = usedInv;
  const { name, locked_by: lockedBy } = investible;
  const breadCrumbTemplates = [{ name: market.name, link: formMarketLink(marketId) }];
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const amEditing = lockedBy && (lockedBy === userId);
  const someoneElseEditing = lockedBy && (lockedBy !== userId);
  const warning = someoneElseEditing ? 'Someone else is editing this idea!' : undefined;
  // if we have an edit lock, just put us into edit mode
  const [editMode, setEditMode] = useState(amEditing);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const loading = (!investibleId || _.isEmpty(inv) || _.isEmpty(myPresence) || _.isEmpty(user));
  const isDecision = market && market.market_type === DECISION_TYPE;
  const isPlanning = market && market.market_type === PLANNING_TYPE;

  const isAdmin = myPresence && myPresence.is_admin;

  function toggleEdit() {
    if (!editMode) {
      // for now, just break the lock always
      const breakLock = true;
      // console.debug('Taking out lock');
      return lockInvestibleForEdit(marketId, investibleId, breakLock)
        .then(() => setEditMode(true));
    }
    // console.debug('Releasing lock');
    return realeaseInvestibleEditLock(marketId, investibleId)
      .then(() => setEditMode(false));
  }

  function onSave() {
    // save automagically releases the lock, so we just toggle edit
    setEditMode(false);
  }

  if (loading) {
    return (
      <Screen
        title={name}
        tabTitle={name}
        breadCrumbs={breadCrumbs}
        hidden={hidden}
        warning={warning}
        loading={loading}
      >
        <div />
      </Screen>
    );
  }

  if (isDecision) {
    if (editMode) {
      return (
        <DecisionInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          onSave={onSave}
          onCancel={toggleEdit}
          isAdmin={isAdmin}
        />
      );
    }
    return (
      <DecisionInvestible
        userId={userId}
        investibleId={investibleId}
        market={market}
        fullInvestible={usedInv}
        commentsHash={commentsHash}
        marketPresences={marketPresences}
        investibleComments={investibleComments}
        toggleEdit={toggleEdit}
        isAdmin={isAdmin}
      />
    );
  }

  if (isPlanning) {
    if (editMode) {
      return (
        <PlanningInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          marketPresences={marketPresences}
          onSave={onSave}
          onCancel={toggleEdit}
          isAdmin={isAdmin}
        />
      );
    }
    return (
      <PlanningInvestible
        userId={userId}
        investibleId={investibleId}
        market={market}
        marketInvestible={inv}
        investibles={investibles}
        commentsHash={commentsHash}
        marketPresences={marketPresences}
        investibleComments={investibleComments}
        toggleEdit={toggleEdit}
        isAdmin={isAdmin}
      />
    );
  }
  if (editMode) {
    return (
      <InitiativeInvestibleEdit
        fullInvestible={inv}
        marketId={marketId}
        marketPresences={marketPresences}
        onSave={onSave}
        onCancel={toggleEdit}
      />
    );
  }
  return (
    <InitiativeInvestible
      userId={userId}
      investibleId={investibleId}
      market={market}
      fullInvestible={usedInv}
      marketPresences={marketPresences}
      investibleComments={investibleComments}
      toggleEdit={toggleEdit}
      isAdmin={isAdmin}
    />
  );
}

Investible.propTypes = {
  hidden: PropTypes.bool,
};

Investible.defaultProps = {
  hidden: false,
};

export default Investible;
