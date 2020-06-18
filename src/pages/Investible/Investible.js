import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import _ from 'lodash'
import Screen from '../../containers/Screen/Screen'
import {
  decomposeMarketPath,
  formInvestibleEditLink,
  formMarketLink,
  makeArchiveBreadCrumbs,
  makeBreadCrumbs,
  navigate,
} from '../../utils/marketIdPathFunctions'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getInvestible, getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket, getMyUserForMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import DecisionInvestible from './Decision/DecisionInvestible'
import PlanningInvestible from './Planning/PlanningInvestible'
import { ACTIVE_STAGE, DECISION_TYPE, PLANNING_TYPE } from '../../constants/markets'
import InitiativeInvestible from './Initiative/InitiativeInvestible'
import { getMarketFromUrl } from '../../api/uclusionClient'
import { pollForMarketLoad } from '../../api/versionedFetchUtils'
import { toastError } from '../../utils/userMessage'
import { VersionsContext } from '../../contexts/VersionsContext/VersionsContext'

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
  const realMarket = getMarket(marketsState, marketId);
  const market = realMarket || emptyMarket;
  const userId = getMyUserForMarket(marketsState, marketId) || '';
  const [commentsState] = useContext(CommentsContext);
  const comments = getMarketComments(commentsState, marketId);
  const investibleComments = comments.filter((comment) => comment.investible_id === investibleId);
  const commentsHash = createCommentsHash(investibleComments);
  const [investiblesState] = useContext(InvestiblesContext);
  const [loadingMarketId, setLoadingMarketId] = useState(undefined);
  const [, versionsDispatch] = useContext(VersionsContext);
  const isInitialization = investiblesState.initializing || marketsState.initializing || marketPresencesState.initializing || commentsState.initializing;
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const inv = getInvestible(investiblesState, investibleId);
  const usedInv = inv || emptyInvestible;
  const { investible } = usedInv;
  const { name } = investible;
  const breadCrumbTemplates = [{ name: market.name, link: formMarketLink(marketId), id: 'marketCrumb' }];
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const loading = !investibleId || _.isEmpty(inv) || _.isEmpty(myPresence) || !userId || _.isEmpty(realMarket);
  const isDecision = market && market.market_type === DECISION_TYPE;
  const isPlanning = market && market.market_type === PLANNING_TYPE;
  const { market_stage: marketStage } = market;
  const isAdmin = myPresence && myPresence.is_admin;
  const inArchives = marketStage !== ACTIVE_STAGE || (myPresence && !myPresence.following);
  const breadCrumbs = inArchives ?
    makeArchiveBreadCrumbs(history, breadCrumbTemplates) :
    makeBreadCrumbs(history, breadCrumbTemplates);


  useEffect(() => {
    const noMarketLoad = _.isEmpty(realMarket) && _.isEmpty(marketPresences);
    if (!isInitialization && noMarketLoad && !hidden && marketId && loadingMarketId !== marketId) {
        setLoadingMarketId(marketId);
        // Login with market id to create guest capability if necessary
        getMarketFromUrl(marketId).then((loginData) =>{
          const { market } = loginData;
          const { id, version} = market;
          return pollForMarketLoad(id, version, versionsDispatch);
        }).catch((error) => {
          console.error(error);
          toastError('errorMarketFetchFailed');
        });
    }
  }, [isInitialization, history, hidden, marketId, realMarket, marketPresences, loadingMarketId,
    versionsDispatch]);


  function toggleEdit() {
    navigate(history, formInvestibleEditLink(marketId, investibleId));
  }

  if (loading) {
    return (
      <Screen
        title={name}
        tabTitle={name}
        breadCrumbs={breadCrumbs}
        hidden={hidden}
        loading
      >
        <div />
      </Screen>
    );
  }

  if (isDecision) {
    return (
      <DecisionInvestible
        userId={userId}
        investibleId={investibleId}
        market={market}
        fullInvestible={usedInv}
        comments={comments}
        marketPresences={marketPresences}
        investibleComments={investibleComments}
        toggleEdit={toggleEdit}
        isAdmin={isAdmin}
        inArchives={inArchives}
        hidden={hidden}
      />
    );
  }

  if (isPlanning) {
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
        inArchives={inArchives}
        isAdmin={isAdmin}
        hidden={hidden}
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
      isAdmin={isAdmin}
      inArchives={inArchives}
      hidden={hidden}
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
