import React, { useContext, useEffect, useState } from 'react'
import _ from 'lodash'
import { useHistory, useLocation } from 'react-router'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import {
  decomposeMarketPath,
  formInvestibleLink,
  formMarketArchivesLink,
  formMarketLink,
  navigate,
} from '../../utils/marketIdPathFunctions'
import Screen from '../../containers/Screen/Screen'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket, marketTokenLoaded } from '../../contexts/MarketsContext/marketsContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import DecisionDialog from './Decision/DecisionDialog'
import PlanningDialog from './Planning/PlanningDialog'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getComment, getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { getStages } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { ACTIVE_STAGE, DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
import jwt_decode from 'jwt-decode'
import { userIsLoaded } from '../../contexts/AccountUserContext/accountUserContextHelper'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import OnboardingBanner from '../../components/Banners/OnboardingBanner'
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import { pushMessage } from '../../utils/MessageBusUtils'
import {
  GUEST_MARKET_EVENT,
  INVITE_MARKET_EVENT,
  LOAD_MARKET_CHANNEL
} from '../../contexts/MarketsContext/marketsContextMessages'
import UpgradeBanner from '../../components/Banners/UpgradeBanner'
import { canCreate } from '../../contexts/AccountContext/accountContextHelper'
import {
  hasInitializedGlobalVersion,
  hasLoadedGlobalVersion
} from '../../contexts/VersionsContext/versionsContextHelper'
import { VersionsContext } from '../../contexts/VersionsContext/VersionsContext'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'

function Dialog(props) {
  const { hidden } = props;
  const [addInvestibleMode, setAddInvestibleMode] = useState(false);
  const history = useHistory();
  const intl = useIntl();
  const location = useLocation();
  const { pathname, hash } = location
  const myHashFragment = (hash && hash.length > 1) ? hash.substring(1, hash.length) : undefined
  const { marketId: marketEntity, action } = decomposeMarketPath(pathname);
  const myParams = new URL(document.location).searchParams;
  const subscribeId = myParams ? myParams.get('subscribeId') : undefined;
  const [marketIdFromToken, setMarketIdFromToken] = useState(undefined);
  const [marketsState, , tokensHash] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const marketId = action === 'invite' ? marketIdFromToken : marketEntity;
  const allInvestibles = getMarketInvestibles(investiblesState, marketId) || [];
  const comments = getMarketComments(commentsState, marketId) || [];
  const investibles = _.isEmpty(search) ? allInvestibles : allInvestibles.filter((inv) => {
    const { investible } = inv;
    return results.find((item) => item.id === investible.id)
      || parentResults.find((parentId) => parentId === investible.id);
  });
  const loadedMarket = getMarket(marketsState, marketId);
  const renderableMarket = loadedMarket || {};
  const { market_type: marketType, parent_comment_market_id: parentMarketId, parent_comment_id: parentCommentId,
    market_stage: marketStage } = renderableMarket || '';
  const isInline = !_.isEmpty(parentCommentId);
  const inlineComments = getMarketComments(commentsState, parentMarketId || marketId) || [];
  const parentComment = inlineComments.find((comment) => comment.id === parentCommentId) || {};
  const parentInvestibleId = parentComment.investible_id;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const isInitialization = marketsState.initializing || investiblesState.initializing
    || marketPresencesState.initializing || marketStagesState.initializing || commentsState.initializing;
  const marketStages = getStages(marketStagesState, marketId);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const [userState] = useContext(AccountUserContext);
  const [versionsContext] = useContext(VersionsContext);
  const [operationRunning] = useContext(OperationInProgressContext);
  const [accountState] = useContext(AccountContext);
  const hasUser = userIsLoaded(userState);
  const loading = !hasUser || isInitialization || !myPresence || !marketType || marketType === INITIATIVE_TYPE
    || (isInline && activeMarket) || !marketTokenLoaded(marketId, tokensHash);
  const createEnabled = canCreate(accountState);
  //While fore ground loads there is no global version and operation is running
  const loadingForeGroundMarkets = !hasLoadedGlobalVersion(versionsContext) || marketsState.initializing ||
    (!hasInitializedGlobalVersion(versionsContext) && operationRunning);
  const banner = !loading && _.isEmpty(marketStages) ? <OnboardingBanner messageId='OnboardingInviteDialog' /> :
    (loadingForeGroundMarkets || createEnabled ? undefined : <UpgradeBanner/>);

  useEffect(() => {
    if (!hidden && !isInitialization && hasUser) {
      let proposedMarketId;
      if (action === 'invite') {
        const decoded = jwt_decode(marketEntity);
        proposedMarketId = decoded.market_id;
        setMarketIdFromToken(proposedMarketId);
      } else {
        proposedMarketId = marketEntity;
      }
      // Ignore regular URL case because can cause performance problems to do things for that case
      if (subscribeId) {
        const loadedMarket = getMarket(marketsState, proposedMarketId);
        if (subscribeId !== marketEntity || _.isEmpty(loadedMarket)) {
          pushMessage(LOAD_MARKET_CHANNEL, { event: GUEST_MARKET_EVENT, marketId: marketEntity, subscribeId });
          if (subscribeId === marketEntity) {
            console.info('Replacing pathname for subcribed market entity');
            // Comments will be handled by scroll context
            window.history.replaceState(null, '', window.location.pathname);
          }
        }
      } else if (action === 'invite') {
        const loadedMarket = getMarket(marketsState, proposedMarketId);
        if (_.isEmpty(loadedMarket)) {
          pushMessage(LOAD_MARKET_CHANNEL, { event: INVITE_MARKET_EVENT, marketToken: marketEntity });
        }
      }
    }
    if (hidden) {
      setMarketIdFromToken(undefined);
    }
  }, [action, hasUser, hidden, isInitialization, marketEntity, marketsState, subscribeId]);

  useEffect(() => {
    if (!hidden && action === 'invite' && marketId && !_.isEmpty(marketStages) && marketType !== INITIATIVE_TYPE) {
      // Try to remove the market token from the URL to avoid book marking it or other weirdness
      // Potentially this fails since inside useEffect
      console.info('Navigating to market');
      history.push(formMarketLink(marketId));
    }
    return () => {}
  }, [hidden, action, history, marketId, marketStages, marketType]);

  useEffect(() => {
    function getInitiativeInvestible(baseInvestible) {
      const { investible } = baseInvestible;
      const { id } = investible;
      const {
        investibleId: onInvestibleId,
      } = decomposeMarketPath(location.pathname);
      if (onInvestibleId === id) {
        return;
      }
      const link = formInvestibleLink(marketId, id);
      console.info('Navigating to initiative');
      navigate(history, link, true);
    }
    if (!hidden && marketType === INITIATIVE_TYPE && !isInline && !_.isEmpty(investibles)) {
      getInitiativeInvestible(investibles[0]);
    }
  }, [hidden, history, investibles, isInline, location.pathname, marketId, marketType])

  useEffect(() => {
    if (!hidden) {
      if (isInline) {
        const link = parentInvestibleId ? formInvestibleLink(parentMarketId, parentInvestibleId) :
          formMarketLink(parentMarketId);
        const fullLink = `${link}#c${parentCommentId}`;
        console.info('Navigating to inline');
        navigate(history, fullLink, true);
      } else if (marketType === PLANNING_TYPE && myHashFragment) {
        if (!myHashFragment.startsWith('cv') && (myHashFragment.startsWith('c')||myHashFragment.startsWith('editc'))) {
          const commentId = myHashFragment.startsWith('c') ? myHashFragment.substr(1)
            : myHashFragment.substr(5);
          const comment = getComment(commentsState, marketId, commentId) || {}
          const { resolved, investible_id: investibleId } = comment;
          if (investibleId) {
            const link = formInvestibleLink(marketId, investibleId);
            const fullLink = `${link}#c${commentId}`;
            console.info('Navigating to comment in story');
            navigate(history, fullLink, true);
          } else if (resolved) {
            const link = formMarketArchivesLink(marketId);
            const fullLink = myHashFragment.startsWith('c') ? `${link}#c${commentId}` : `${link}#editc${commentId}`;
            console.info('Navigating to resolved comment');
            navigate(history, fullLink, true);
          }
        }
      }
    }

    return () => {
    }
  }, [hidden, marketType, investibles, marketId, history, location, marketStages, marketPresences, isInline,
    parentMarketId, parentInvestibleId, parentCommentId, myHashFragment, commentsState]);

  if (loading) {
    return (
      <Screen
        hidden={hidden}
        loading={loading}
        title={intl.formatMessage({ id: 'loadingMessage' })}
        tabTitle={intl.formatMessage({ id: 'loadingMessage' })}
      >
        <div />
      </Screen>
    );
  }

  return (
    <>
      {marketType === DECISION_TYPE && myPresence && (
        <DecisionDialog
          hidden={hidden}
          addInvestibleMode={addInvestibleMode}
          setAddInvestibleMode={setAddInvestibleMode}
          market={renderableMarket}
          investibles={investibles}
          comments={comments}
          marketStages={marketStages}
          marketPresences={marketPresences}
          myPresence={myPresence}
          banner={banner}
        />
      )}
      {marketType === PLANNING_TYPE && myPresence && (
        <PlanningDialog
          hidden={hidden}
          addInvestibleMode={addInvestibleMode}
          setAddInvestibleMode={setAddInvestibleMode}
          market={renderableMarket}
          investibles={investibles}
          comments={comments}
          marketStages={marketStages}
          marketPresences={marketPresences}
          myPresence={myPresence}
          banner={banner}
        />
      )}
    </>
  );
}

Dialog.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Dialog;
