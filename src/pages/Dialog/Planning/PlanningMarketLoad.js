import React, { Suspense, useContext } from 'react';
import { useIntl } from 'react-intl';
import Screen from '../../../containers/Screen/Screen';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { useHistory } from 'react-router';
import { decomposeMarketPath } from '../../../utils/marketIdPathFunctions';
import { suspend } from 'suspend-react';
import { getMarketFromInvite } from '../../../api/marketLogin';
import { updateMessages } from '../../../contexts/NotificationsContext/notificationsContextReducer';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper';
import { addPresenceToMarket } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { updateMarketStagesFromNetwork } from '../../../contexts/MarketStagesContext/marketStagesContextReducer';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import TokenStorageManager from '../../../authorization/TokenStorageManager';
import { TOKEN_TYPE_MARKET } from '../../../api/tokenConstants';
import { pushMessage } from '../../../utils/MessageBusUtils';
import { GUEST_MARKET_EVENT, LOAD_MARKET_CHANNEL } from '../../../contexts/MarketsContext/marketsContextMessages';
import { AccountContext } from '../../../contexts/AccountContext/AccountContext';
import { accountUserJoinedMarket } from '../../../contexts/AccountContext/accountContextReducer';
import { dehighlightMessage } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import jwt_decode from 'jwt-decode';
import { sendMarketsStruct, updateMarkets } from '../../../api/versionedFetchUtils';
import _ from 'lodash';
import WorkspaceInviteWizard from '../../../components/AddNewWizards/WorkspaceInvite/WorkspaceInviteWizard';
import { setCurrentWorkspace } from '../../../utils/redirectUtils';

function PlanningMarketLoad() {
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, stagesDispatch] = useContext(MarketStagesContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, userDispatch] = useContext(AccountContext);
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId: marketToken } = decomposeMarketPath(pathname);
  const fallBack = <Screen hidden={false} loading loadingMessageId='marketLoadingMessage'
                           title={intl.formatMessage({ id: 'loadingMessage' })}>
    <div />
  </Screen>;

  function LoadMarket({ marketToken }) {
    const loadedProperties = suspend(async () => {
      try {
        const result = await getMarketFromInvite(marketToken);
        console.log('Quick adding market after invite load');
        // The user below is not home user so just fabricate the onboarding state if necessary
        userDispatch(accountUserJoinedMarket());
        const { market, user, stages, uclusion_token: token, investible, notifications } = result;
        const { id } = market;
        if (notifications) {
          messagesDispatch(updateMessages(notifications));
        }
        addPresenceToMarket(marketPresencesDispatch, id, user);
        stagesDispatch(updateMarketStagesFromNetwork({ [id]: stages }));
        if (investible) {
          refreshInvestibles(investiblesDispatch, diffDispatch, [investible], false);
        }
        const tokenStorageManager = new TokenStorageManager();
        await tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, id, token);
        addMarketToStorage(marketsDispatch, market);
        const marketsStruct = {};
        // Have to load the rest here otherwise even the welcome is wrong - no groups etc.
        return updateMarkets([id], marketsStruct, 1, {})
          .then(() => {
            sendMarketsStruct(marketsStruct);
            const commentStructs = marketsStruct['comments'] || {};
            const comments = commentStructs[id] || [];
            const inlineMarketIds = [];
            comments.forEach((comment) => {
              const inlineMarketId = comment.inline_market_id;
              if (inlineMarketId) {
                inlineMarketIds.push(inlineMarketId);
              }
            });
            if (!_.isEmpty(inlineMarketIds)) {
              console.log('Quick adding inline markets on invite load');
              const inlineMarketsStruct = {}
              return updateMarkets(inlineMarketIds, inlineMarketsStruct, 1, {})
                .then(() => {
                  sendMarketsStruct(inlineMarketsStruct);
                  setCurrentWorkspace(id);
                  return { id };
                });
            }
            setCurrentWorkspace(id);
            return { id };
          });
      } catch (error) {
        console.error('Quick adding market failed load:');
        console.error(error);
        const decoded = jwt_decode(marketToken);
        // This won't get the inline but okay as a fallback
        pushMessage(LOAD_MARKET_CHANNEL, { event: GUEST_MARKET_EVENT, marketId: decoded.market_id });
        return {};
      }
    }, [marketToken]);
    const { id } = loadedProperties;
    const decoded = jwt_decode(marketToken);
    return (
      <Screen
        title={intl.formatMessage({id: 'WorkspaceWelcome'})}
        tabTitle={intl.formatMessage({id: 'WorkspaceWelcome'})}
        hidden={false}
        disableSearch
      >
        <WorkspaceInviteWizard marketId={id || decoded.market_id} />
      </Screen>
    );
  }

  return (
    <Suspense fallback={fallBack}>
      <LoadMarket marketToken={marketToken} />
    </Suspense>
  );
}

export default PlanningMarketLoad;
