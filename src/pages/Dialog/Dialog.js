import React, { useContext, useEffect, useState } from 'react'
import _ from 'lodash'
import { useHistory, useLocation, useParams } from 'react-router'
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
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
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

function Dialog(props) {
  const { hidden } = props;
  const [addInvestibleMode, setAddInvestibleMode] = useState(false);
  const history = useHistory();
  const intl = useIntl();
  const location = useLocation();
  const { pathname, hash } = location
  const myHashFragment = (hash && hash.length > 1) ? hash.substring(1, hash.length) : undefined
  const { marketId: marketEntity, action } = decomposeMarketPath(pathname);
  const { subscribeId } = useParams();
  const [marketId, setMarketId] = useState(undefined);
  const [marketsState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { results } = searchResults;
  const allInvestibles = getMarketInvestibles(investiblesState, marketId) || [];
  const allComments = getMarketComments(commentsState, marketId) || [];
  const investibles = _.isEmpty(results) ? allInvestibles : allInvestibles.filter((inv) => {
    const { investible } = inv;
    return results.find((item) => item.id === investible.id);
  });
  const comments = _.isEmpty(results) ? allComments : allComments.filter((comment) => {
    return results.find((item) => item.id === comment.id);
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
  const isInitialization = marketsState.initializing || investiblesState.initializing || marketPresencesState.initializing || marketStagesState.initializing;
  const marketStages = getStages(marketStagesState, marketId);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const loading = !myPresence || !marketType || marketType === INITIATIVE_TYPE || (isInline && activeMarket);
  const [userState] = useContext(AccountUserContext);
  const hasUser = userIsLoaded(userState);
  const banner = !isInitialization && !loading && _.isEmpty(marketStages) ?
    <OnboardingBanner messageId='OnboardingInviteDialog' /> : undefined;

  useEffect(() => {
    if (!hidden && !isInitialization && hasUser) {
      let proposedMarketId;
      if (action === 'invite') {
        const decoded = jwt_decode(marketEntity);
        proposedMarketId = decoded.market_id;
      } else {
        proposedMarketId = marketEntity;
      }
      const loadedMarket = getMarket(marketsState, proposedMarketId);
      if (subscribeId) {
        pushMessage(LOAD_MARKET_CHANNEL, { event: GUEST_MARKET_EVENT, marketId: proposedMarketId,
          subscribeId });
      } else if (_.isEmpty(loadedMarket)) {
        if (action === 'invite') {
          pushMessage(LOAD_MARKET_CHANNEL, { event: INVITE_MARKET_EVENT, marketToken: marketEntity });
        } else {
          pushMessage(LOAD_MARKET_CHANNEL, { event: GUEST_MARKET_EVENT, marketId: proposedMarketId });
        }
      }
      setMarketId(proposedMarketId);
    }
    if (hidden) {
      setMarketId(undefined);
    }
  }, [action, hasUser, hidden, isInitialization, marketEntity, marketId, marketsState, subscribeId]);

  useEffect(() => {
    if (!hidden && action === 'invite' && marketId && !_.isEmpty(marketStages) && marketType !== INITIATIVE_TYPE) {
      // Try to remove the market token from the URL to avoid book marking it or other weirdness
      // Potentially this fails since inside useEffect
      history.push(formMarketLink(marketId));
    }
    return () => {}
  }, [hidden, action, history, marketId, marketStages, marketType]);

  useEffect(() => {
    function getInitiativeInvestible(baseInvestible) {
      const {
        investibleId: onInvestibleId,
      } = decomposeMarketPath(location.pathname);
      if (onInvestibleId) {
        return;
      }
      const { investible } = baseInvestible;
      const { id } = investible;
      const link = formInvestibleLink(marketId, id);
      navigate(history, link, true);
    }
    if (!hidden) {
      if (isInline) {
        const link = parentInvestibleId ? formInvestibleLink(parentMarketId, parentInvestibleId) :
          formMarketLink(parentMarketId);
        const fullLink = `${link}#c${parentCommentId}`;
        navigate(history, fullLink, true);
      }
      else if (marketType === INITIATIVE_TYPE) {
        if (Array.isArray(investibles) && investibles.length > 0) {
          getInitiativeInvestible(investibles[0])
        }
      } else if (marketType === PLANNING_TYPE && myHashFragment) {
        if (!myHashFragment.startsWith('cv') && (myHashFragment.startsWith('c')||myHashFragment.startsWith('editc'))) {
          const commentId = myHashFragment.startsWith('c') ? myHashFragment.substr(1)
            : myHashFragment.substr(5);
          const comment = getComment(commentsState, marketId, commentId) || {}
          const { resolved, investible_id: investibleId } = comment;
          if (investibleId) {
            const link = formInvestibleLink(marketId, investibleId);
            const fullLink = `${link}#c${commentId}`;
            navigate(history, fullLink, true);
          } else if (resolved) {
            const link = formMarketArchivesLink(marketId);
            const fullLink = myHashFragment.startsWith('c') ? `${link}#c${commentId}` : `${link}#editc${commentId}`;
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
      {marketType === PLANNING_TYPE && (
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
          searchResults={results}
        />
      )}
    </>
  );
}

Dialog.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Dialog;
