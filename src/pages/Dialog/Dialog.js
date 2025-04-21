import React, { useContext, useEffect, useState } from 'react'
import _ from 'lodash'
import { useHistory, useLocation } from 'react-router'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import {
  decomposeMarketPath,
  formInvestibleLink,
  navigate
} from '../../utils/marketIdPathFunctions'
import Screen from '../../containers/Screen/Screen'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket, marketTokenLoaded } from '../../contexts/MarketsContext/marketsContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import PlanningDialog from './Planning/PlanningDialog'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { getStages } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { userIsLoaded } from '../../contexts/AccountContext/accountUserContextHelper'
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext'
import UpgradeBanner from '../../components/Banners/UpgradeBanner'
import { canCreate } from '../../contexts/AccountContext/accountContextHelper'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'
import queryString from 'query-string';

function Dialog(props) {
  const { hidden, loadedMarketId } = props;
  const [addInvestibleMode, setAddInvestibleMode] = useState(false);
  const history = useHistory();
  const intl = useIntl();
  const location = useLocation();
  const { pathname, hash, search: querySearch } = location
  const values = queryString.parse(querySearch);
  const { groupId: proposedGroupId } = values || {};
  const myHashFragment = (hash && hash.length > 1) ? hash.substring(1, hash.length) : undefined;
  const { marketId: marketEntity } = decomposeMarketPath(pathname);
  const [marketsState, , tokensHash] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const marketId = loadedMarketId || marketEntity;
  const groupId = proposedGroupId || marketId;
  const allInvestibles = getMarketInvestibles(investiblesState, marketId) || [];
  const comments = getMarketComments(commentsState, marketId, groupId) || [];
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
  const [userState] = useContext(AccountContext);
  const hasUser = userIsLoaded(userState);
  const loading = !hasUser || isInitialization || !myPresence || !marketType ||
    !marketTokenLoaded(marketId, tokensHash);
  const createEnabled = canCreate(userState);
  const banner = (loading || createEnabled ? undefined : <UpgradeBanner/>);

  useEffect(() => {
    if (!hidden && myHashFragment) {
      // Check for a comment that was moved to a job (or link would not come here) and send it there
      if (!myHashFragment.startsWith('cv') && (myHashFragment.startsWith('c'))) {
        const comments = getMarketComments(commentsState, marketId) || [];
        const comment = comments.find((comment) => myHashFragment.includes(comment.id));
        const { investible_id: investibleId } = comment || {};
        if (investibleId) {
          const link = formInvestibleLink(marketId, investibleId);
          const fullLink = `${link}#c${comment.id}`;
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
        loadingMessageId='loadingMessage'
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
      groupId={groupId}
    />
  );
}

Dialog.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Dialog;
