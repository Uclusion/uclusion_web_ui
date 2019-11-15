import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import Screen from '../../containers/Screen/Screen';
import {
  makeBreadCrumbs,
  formMarketLink,
  decomposeMarketPath
} from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket, getMyUserForMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import _ from 'lodash';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import DecisionInvestible from './Decision/DecisionInvestible';
import DecisionInvestibleEdit from './Decision/DecisionInvestibleEdit';
import { lockInvestibleForEdit, realeaseInvestibleEditLock } from '../../api/investibles';

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
  const inv = getInvestible(investiblesState, investibleId);
  const usedInv = inv || emptyInvestible;
  const { investible } = usedInv;
  const { name, locked_by } = investible;
  const breadCrumbTemplates = [{ name: market.name, link: formMarketLink(marketId) }];
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  const amEditing = locked_by && (locked_by === userId);
  const someoneElseEditing = locked_by && (locked_by !== userId);
  const warning = someoneElseEditing? 'Someone else is editing this idea!' : undefined;
  const [editMode, setEditMode] = useState(amEditing); // if we have an edit lock, just put us into edit mode
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const loading = (!investibleId || _.isEmpty(inv) || _.isEmpty(myPresence) || _.isEmpty(user));
  if(!loading) {
    console.log(investible);
    console.log(myPresence);
    console.log(user);
  }
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

  return (
    <Screen
      title={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
      warning={warning}
      loading={loading}
    >
      {!loading && !editMode && (
        <DecisionInvestible
          userId={userId}
          investibleId={investibleId}
          marketId={marketId}
          investible={investible}
          commentsHash={commentsHash}
          marketPresences={marketPresences}
          investibleComments={investibleComments}
          toggleEdit={toggleEdit}
          isAdmin={isAdmin}
        />)}
      {!loading && editMode && (
        <DecisionInvestibleEdit
          fullInvestible={inv}
          marketId={marketId}
          onSave={onSave}
          onCancel={toggleEdit}
          isAdmin={isAdmin}
        />
      )}
    </Screen>
  );
}

Investible.propTypes = {
  hidden: PropTypes.bool,
};

Investible.defaultProps = {
  hidden: false,
};

export default Investible;
