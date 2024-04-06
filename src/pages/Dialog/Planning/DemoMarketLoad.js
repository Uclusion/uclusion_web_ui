import React, { Suspense, useContext } from 'react';
import { useIntl } from 'react-intl';
import Screen from '../../../containers/Screen/Screen';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { suspend } from 'suspend-react';
import Market from '../Dialog';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { OnboardingState } from '../../../contexts/AccountContext/accountUserContextHelper';
import _ from 'lodash';
import { getDemo } from '../../../api/homeAccount';
import { SearchIndexContext } from '../../../contexts/SearchIndexContext/SearchIndexContext';
import { handleMarketData } from '../../../utils/demoLoader';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { TicketIndexContext } from '../../../contexts/TicketContext/TicketIndexContext';
import { accountUserRefresh } from '../../../contexts/AccountContext/accountContextReducer';
import { AccountContext } from '../../../contexts/AccountContext/AccountContext';

function DemoMarketLoad(props) {
  const { onboardingState, demo } = props;
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, marketStagesDispatch] = useContext(MarketStagesContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, commentsDispatch] = useContext(CommentsContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, groupMembersDispatch] = useContext(GroupMembersContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, ticketsDispatch] = useContext(TicketIndexContext);
  const [, userDispatch] = useContext(AccountContext);
  const [index] = useContext(SearchIndexContext);
  const intl = useIntl();

  const loadingScreen = <Screen hidden={false} loading loadingMessageId='demoLoadingMessage'
                                title={intl.formatMessage({ id: 'loadingMessage' })}>
    <div />
  </Screen>;

  function LoadDemo() {
    const loadedMarketId = suspend(async () => {
      const result = await getDemo();
      if (!result) {
        // Called more than once somehow so give up and hope demo market already loaded or loads the slow way
        return undefined;
      }
      console.log('Quick adding demo market after load');
      const dispatchers = {
        marketsDispatch, messagesDispatch, marketStagesDispatch, groupsDispatch, presenceDispatch, groupMembersDispatch,
        investiblesDispatch, commentsDispatch, diffDispatch, index, ticketsDispatch
      }
      const { demo, user } = result;
      const id = await handleMarketData(demo, dispatchers);
      userDispatch(accountUserRefresh(user));
      return id;
    }, [])
    return loadedMarketId === undefined ? loadingScreen : <Market hidden={false} loadedMarketId={loadedMarketId}/>;
  }

  if (onboardingState !== OnboardingState.NeedsOnboarding || !_.isEmpty(demo)) {
    if (_.isEmpty(demo)) {
      return loadingScreen;
    }
    return <Market hidden={false} loadedMarketId={demo.id}/>;
  }

  return (
    <Suspense fallback={loadingScreen}>
      <LoadDemo />
    </Suspense>
  );
}

export default DemoMarketLoad;
