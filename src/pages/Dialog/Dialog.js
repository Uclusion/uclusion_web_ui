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
import PlanningDialog from './Planning/PlanningDialog'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getComment, getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { getStages } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import jwt_decode from 'jwt-decode'
import { userIsLoaded } from '../../contexts/AccountUserContext/accountUserContextHelper'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import OnboardingBanner from '../../components/Banners/OnboardingBanner'
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import { pushMessage } from '../../utils/MessageBusUtils'
import {
  INVITE_MARKET_EVENT,
  LOAD_MARKET_CHANNEL
} from '../../contexts/MarketsContext/marketsContextMessages'
import UpgradeBanner from '../../components/Banners/UpgradeBanner'
import { canCreate } from '../../contexts/AccountContext/accountContextHelper'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'

function Dialog(props) {
  const { hidden } = props;
  const [addInvestibleMode, setAddInvestibleMode] = useState(false);
  const history = useHistory();
  const intl = useIntl();
  const location = useLocation();
  const { pathname, hash } = location
  const myHashFragment = (hash && hash.length > 1) ? hash.substring(1, hash.length) : undefined;
  const { marketId: marketEntity, action } = decomposeMarketPath(pathname);
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
  const { market_type: marketType } = renderableMarket;
  const isInitialization = marketsState.initializing || investiblesState.initializing
    || marketPresencesState.initializing || marketStagesState.initializing || commentsState.initializing;
  const marketStages = getStages(marketStagesState, marketId);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const [accountState] = useContext(AccountContext);
  const [userState] = useContext(AccountUserContext);
  const hasUser = userIsLoaded(userState);
  const loading = !hasUser || isInitialization || !myPresence || !marketType ||
    !marketTokenLoaded(marketId, tokensHash);
  const createEnabled = canCreate(accountState);
  const banner = !loading && _.isEmpty(marketStages) ? <OnboardingBanner messageId='OnboardingInviteDialog' /> :
    (loading || createEnabled ? undefined : <UpgradeBanner/>);

  useEffect(() => {
    if (!hidden && !isInitialization && hasUser && marketEntity) {
      let proposedMarketId;
      if (action === 'invite') {
        const decoded = jwt_decode(marketEntity);
        proposedMarketId = decoded.market_id;
        setMarketIdFromToken(proposedMarketId);
      } else {
        proposedMarketId = marketEntity;
      }
      // Ignore regular URL case because can cause performance problems to do things for that case
      if (action === 'invite') {
        const loadedMarket = getMarket(marketsState, proposedMarketId);
        if (_.isEmpty(loadedMarket)) {
          pushMessage(LOAD_MARKET_CHANNEL, { event: INVITE_MARKET_EVENT, marketToken: marketEntity })
          //Immediately replace the invite in the path name so don't send twice
          window.history.replaceState(null, '', formMarketLink(proposedMarketId, proposedMarketId));
        }
      }
    }
    if (hidden) {
      setMarketIdFromToken(undefined);
    }
  }, [action, hasUser, hidden, isInitialization, marketEntity, marketsState]);

  useEffect(() => {
    if (!hidden && action === 'invite' && marketId && !_.isEmpty(loadedMarket)) {
      // Try to remove the market token from the URL to avoid book marking it or other weirdness
      // Potentially this fails since inside useEffect
      console.info('Navigating to market');
      history.push(formMarketLink(marketId, marketId));
    }
    return () => {}
  }, [hidden, action, history, marketId, loadedMarket, marketType]);

  useEffect(() => {
    if (!hidden && myHashFragment) {
      if (!myHashFragment.startsWith('cv') && (myHashFragment.startsWith('c'))) {
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
          const fullLink = `${link}#c${commentId}`;
          console.info('Navigating to resolved comment');
          navigate(history, fullLink, true);
        }
      }
    }

    return () => {
    }
  }, [commentsState, hidden, history, marketId, myHashFragment]);

  if (loading) {
    return (
      <Screen
        hidden={hidden}
        loading={loading}
        title={intl.formatMessage({ id: 'loadingMessage' })}
      >
        <div />
      </Screen>
    );
  }

  return (
    <PlanningDialog
      hidden={hidden}
      addInvestibleMode={addInvestibleMode}
      setAddInvestibleMode={setAddInvestibleMode}
      marketId={marketId}
      marketInvestibles={investibles}
      comments={comments}
      marketStages={marketStages}
      marketPresences={marketPresences}
      myPresence={myPresence}
      banner={banner}
    />
  );
}

Dialog.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Dialog;
