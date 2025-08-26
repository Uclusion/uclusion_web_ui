import React, { Suspense, useContext, useEffect } from 'react';
import { useIntl } from 'react-intl';
import Screen from '../../../containers/Screen/Screen';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import _ from 'lodash';
import queryString from 'query-string';
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
import WorkspaceInviteWizard from '../../../components/AddNewWizards/WorkspaceInvite/WorkspaceInviteWizard';
import { useHistory } from 'react-router';
import { formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { setCurrentWorkspace } from '../../../utils/redirectUtils';
import { AwaitComponent, useAsyncLoader } from '../../../utils/PromiseUtils';

function calculateUTM(teamDemo, soloDemo) {
  if (_.isEmpty(teamDemo)&&_.isEmpty(soloDemo)) {
    return undefined;
  }
  if (_.isEmpty(soloDemo)) {
    return 'solo';
  }
  return 'team';
}
// utm_campaign
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
  const history = useHistory();
  const { loader } = useAsyncLoader((myUtm) => getDemo(myUtm === 'team').then((result) => {
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
    return handleMarketData(demo, dispatchers).then((id) => {
      userDispatch(accountUserRefresh(user));
      // If you already have the other market then just navigate to the new id
      if ((myUtm === 'team' && !_.isEmpty(soloDemo))||(myUtm === 'solo' && !_.isEmpty(teamDemo))) {
        navigate(history, formMarketLink(id, id));
      }
      setCurrentWorkspace(id);
      return id;
    });
  }));
  const { location } = history;
  const { search } = location;
  const values = queryString.parse(search || '') || {};
  const { utm_campaign: utm } = values;
  const intl = useIntl();

  const loadingScreen = <Screen hidden={false} loading loadingMessageId='demoLoadingMessage'
                                title={intl.formatMessage({ id: 'loadingMessage' })}>
    <div />
  </Screen>;

  const inviteScreen = <Screen
                          title={intl.formatMessage({id: 'DemoWelcome'})}
                          tabTitle={intl.formatMessage({id: 'DemoWelcome'})}
                          hidden={false}
                          disableSearch
                        >
                          <WorkspaceInviteWizard marketId={utm === 'team' ? teamDemo?.id : soloDemo?.id} isDemo />
                        </Screen>;
  const inviteScreenReady = (utm === 'team' && !_.isEmpty(teamDemo))||(utm === 'solo' && !_.isEmpty(soloDemo));

  function DemoInvite() {
    if (inviteScreenReady) {
      return inviteScreen;
    }
    return loadingScreen;
  }

  useEffect(() => {
    const calculatedUtm = calculateUTM(teamDemo, soloDemo);
    if (_.isEmpty(utm) && calculatedUtm) {
      navigate(history, `/demo?utm_campaign=${calculatedUtm}`, true);
    }
  },  [history, utm, teamDemo, soloDemo]);


  if (_.isEmpty(utm)&&_.isEmpty(calculateUTM(teamDemo, soloDemo))) {
    return <Screen
      title={intl.formatMessage({id: 'DemoWelcome'})}
      tabTitle={intl.formatMessage({id: 'DemoWelcome'})}
      hidden={false}
      disableSearch
      isDemoChoice
    >
      <DemoChoiceWizard />
    </Screen>;
  }

  if (_.isEmpty(utm)) {
    return loadingScreen;
  }

  if (inviteScreenReady) {
    return inviteScreen;
  }

  return (
    <Suspense fallback={loadingScreen}>
      <AwaitComponent 
        loader={loader}
        loaderVal={utm}
        render={DemoInvite}
      />
    </Suspense>
  );
}

export default DemoMarketLoad;
