import React, { Suspense, useContext, useState } from 'react';
import { useIntl } from 'react-intl';
import Screen from '../../../containers/Screen/Screen';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { suspend } from 'suspend-react';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
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
import { isInInbox } from '../../../contexts/NotificationsContext/notificationsContextHelper';
import { setUclusionLocalStorageItem } from '../../../components/localStorageUtils';
import DemoChoiceWizard from '../../../components/AddNewWizards/DemoChoice/DemoChoiceWizard';
import { getUtm } from '../../../utils/redirectUtils';
import WorkspaceInviteWizard from '../../../components/AddNewWizards/WorkspaceInvite/WorkspaceInviteWizard';

function calculateUTM(teamDemo, soloDemo) {
  if (_.isEmpty(teamDemo)&&_.isEmpty(soloDemo)) {
    return undefined;
  }
  if (_.isEmpty(soloDemo)) {
    return 'solo';
  }
  return 'team';
}

function DemoMarketLoad(props) {
  const { teamDemo, soloDemo } = props;
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
  const [utm, setUtm] = useState(getUtm()||calculateUTM(teamDemo, soloDemo));
  const intl = useIntl();

  const loadingScreen = <Screen hidden={false} loading loadingMessageId='demoLoadingMessage'
                                title={intl.formatMessage({ id: 'loadingMessage' })}>
    <div />
  </Screen>;

  function LoadDemo() {
    const loadedInfo = suspend(async () => {
      const result = await getDemo(utm === 'team');
      console.log('Quick adding demo market after load');
      const dispatchers = {
        marketsDispatch, messagesDispatch, marketStagesDispatch, groupsDispatch, presenceDispatch, groupMembersDispatch,
        investiblesDispatch, commentsDispatch, diffDispatch, index, ticketsDispatch, setInitialized
      }
      const { demo, user } = result;
      const { notifications } = demo || {};
      if (notifications) {
        // Screen out support notifications here and in inbox to avoid race conditions
        const notificationsFiltered = notifications.filter((msg) => isInInbox(msg) &&
          (msg.market_id === demo.market.id || msg.comment_market_id === demo.market.id));
        // Only need locally as if they are on another device that is already enough effort
        setUclusionLocalStorageItem('originalDemoNotificationCount', notificationsFiltered.length);
      }
      const id = await handleMarketData(demo, dispatchers);
      userDispatch(accountUserRefresh(user));
      return {id};
    }, []);
    console.log(`Loaded demo market id = ${loadedInfo.id}`);
    return loadingScreen;
  }

  if (_.isEmpty(utm)&&_.isEmpty(soloDemo)&&_.isEmpty(teamDemo)) {
    return <Screen
      title={intl.formatMessage({id: 'DemoWelcome'})}
      tabTitle={intl.formatMessage({id: 'DemoWelcome'})}
      hidden={false}
      disableSearch
      isDemoChoice
    >
      <DemoChoiceWizard setUtm={setUtm} />
    </Screen>;
  }

  if ((utm === 'team' && !_.isEmpty(teamDemo))||(utm === 'solo' && !_.isEmpty(soloDemo))) {
    return <Screen
      title={intl.formatMessage({id: 'DemoWelcome'})}
      tabTitle={intl.formatMessage({id: 'DemoWelcome'})}
      hidden={false}
      disableSearch
    >
      <WorkspaceInviteWizard marketId={utm === 'team' ? teamDemo.id : soloDemo.id} isDemo />
    </Screen>;
  }

  return (
    <Suspense fallback={loadingScreen}>
      <LoadDemo />
    </Suspense>
  );
}

export default DemoMarketLoad;
