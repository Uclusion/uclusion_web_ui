import React, { Suspense, useContext } from 'react';
import { useIntl } from 'react-intl';
import Screen from '../../../containers/Screen/Screen';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { suspend } from 'suspend-react';
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
import Inbox from '../../Home/YourWork/Inbox';
import {
  dehighlightMessage,
  getMessageId,
  isInInbox
} from '../../../contexts/NotificationsContext/notificationsContextHelper';
import { setUclusionLocalStorageItem } from '../../../components/localStorageUtils';

function DemoMarketLoad(props) {
  const { onboardingState, demo, demoMessage } = props;
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, messagesDispatch, , setInitialized] = useContext(NotificationsContext);
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
    const loadedInfo = suspend(async () => {
      const result = await getDemo();
      if (!result) {
        console.warn('No result demo market');
        // Called more than once somehow so give up and hope demo market already loaded or loads the slow way
        return undefined;
      }
      console.log('Quick adding demo market after load');
      const dispatchers = {
        marketsDispatch, messagesDispatch, marketStagesDispatch, groupsDispatch, presenceDispatch, groupMembersDispatch,
        investiblesDispatch, commentsDispatch, diffDispatch, index, ticketsDispatch, setInitialized
      }
      const { demo, user } = result;
      const { notifications } = demo || {};
      if (notifications) {
        const notificationsFiltered = notifications.filter((msg) => isInInbox(msg));
        // Only need locally as if they are on another device that is already enough effort
        setUclusionLocalStorageItem('originalDemoNotificationCount', notificationsFiltered.length);
      }
      const id = await handleMarketData(demo, dispatchers);
      userDispatch(accountUserRefresh(user));
      const workspaceMessage = notifications?.find((message) =>
        message.type_object_id === `UNREAD_GROUP_${id}`);
      dehighlightMessage(workspaceMessage, messagesDispatch);
      return {id, notifications: workspaceMessage ? [workspaceMessage] : undefined};
    }, []);
    return _.isEmpty(loadedInfo?.notifications) ? loadingScreen :
      <Screen
        title={intl.formatMessage({id: 'inbox'})}
        tabTitle={intl.formatMessage({id: 'inbox'})}
        hidden={false}
        isInbox
        groupLoadId={loadedInfo.id}
        disableSearch
      >
      <Inbox hidden={false} messagesFull={loadedInfo.notifications} loadedMarketId={loadedInfo.id}
             workItemId={getMessageId(loadedInfo.notifications[0])}
             messagesHash={{inboxMessagesOrdered: loadedInfo.notifications}}/>
      </Screen>;
  }

  if (onboardingState !== OnboardingState.NeedsOnboarding || !_.isEmpty(demo)) {
    if (_.isEmpty(demo)||_.isEmpty(demoMessage)) {
      return loadingScreen;
    }
    const notifications = [demoMessage];
    return <Screen
      title={intl.formatMessage({id: 'inbox'})}
      tabTitle={intl.formatMessage({id: 'inbox'})}
      hidden={false}
      isInbox
      disableSearch
      groupLoadId={demo.id}
    >
      <Inbox hidden={false} messagesFull={notifications} loadedMarketId={demo.id}
                  workItemId={getMessageId(demoMessage)} messagesHash={{inboxMessagesOrdered: notifications}}/>
    </Screen>;
  }

  return (
    <Suspense fallback={loadingScreen}>
      <LoadDemo />
    </Suspense>
  );
}

export default DemoMarketLoad;
