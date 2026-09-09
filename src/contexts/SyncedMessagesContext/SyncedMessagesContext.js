import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import _ from 'lodash';
import { NotificationsContext } from '../NotificationsContext/NotificationsContext';
import { getNotificationSyncState } from '../NotificationsContext/notificationsContextHelper';
import { MarketsContext } from '../MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../MarketPresencesContext/MarketPresencesContext';
import { CommentsContext } from '../CommentsContext/CommentsContext';
import { InvestiblesContext } from '../InvestibesContext/InvestiblesContext';
import { MarketGroupsContext } from '../MarketGroupsContext/MarketGroupsContext';
import { LeaderContext } from '../LeaderContext/LeaderContext';
import {
  getNotHiddenMarketDetailsForUser,
  marketTokenLoaded
} from '../MarketsContext/marketsContextHelper';
import { useInitialSyncComplete } from '../../api/useInitialSyncComplete';

const NOTIFICATION_DEPENDENCY_HEARTBEAT_MS = 60000;

const EMPTY_SYNC_STATE = { syncedMessages: [], dependencies: [] };

export const SyncedMessagesContext = createContext({ ...EMPTY_SYNC_STATE, stillLoading: true });

/**
 * J-all-440: one authoritative pass over messageIsSynced for the whole app.
 *
 * Every surface that invites the user to open a notification reads syncedMessages from here, so
 * a notification whose comment or investible version has not arrived is not announced anywhere
 * that would lead the user to it. Sweep, clear and dehighlight paths deliberately keep reading
 * messagesState.messages instead: a message the user cannot see is exactly the one a clear action
 * still has to be able to delete, and filtering those would strand it permanently.
 *
 * The pass runs once here rather than once per consumer. B-all-570 added the cold-load dormancy
 * latch because a single messageIsSynced pass over every message on each context tick was
 * starving the sync, so twelve consumers each running their own would reintroduce that cost.
 */
export function SyncedMessagesProvider(props) {
  const { children } = props;
  const [messagesState, , notificationsInitialized] = useContext(NotificationsContext);
  const [marketsState, , tokensHash] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [groupsState] = useContext(MarketGroupsContext);
  const [leaderState, , { requestFreshness }] = useContext(LeaderContext);
  const { messages } = messagesState || {};

  // Dormant until the sync layer says the initial sync converged - the market-token gate alone
  // opens while data is still chunking in (B-all-570).
  const initialSyncComplete = useInitialSyncComplete('syncedMessages');
  const myNotHiddenMarketsState = !initialSyncComplete ? {} :
    getNotHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const stillLoading = !initialSyncComplete || !notificationsInitialized || marketsState.initializing ||
    !_.isEmpty((myNotHiddenMarketsState.marketDetails || []).find((market) =>
      !marketTokenLoaded(market.id, tokensHash)));

  const notificationSyncState = useMemo(() => stillLoading ? EMPTY_SYNC_STATE :
    getNotificationSyncState(messages, marketsState, marketPresencesState, commentsState,
      investiblesState, groupsState), [commentsState, groupsState, investiblesState,
    marketPresencesState, marketsState, messages, stillLoading]);
  const { dependencies: notificationDependencies } = notificationSyncState;

  // Recovery lives here rather than in NavigationChevrons so a notification whose data has not
  // landed is chased whether or not that component is mounted.
  // Keyed on leadership too, so becoming leader re-requests rather than sitting on a snapshot
  // that a follower already recorded.
  const notificationDependencySnapshot = `${leaderState?.isLeader}|${JSON.stringify(notificationDependencies)}`;
  const requestedNotificationSnapshotRef = useRef(undefined);
  useEffect(() => {
    if (stillLoading || requestedNotificationSnapshotRef.current === notificationDependencySnapshot) {
      return;
    }
    requestedNotificationSnapshotRef.current = notificationDependencySnapshot;
    requestFreshness({ reason: 'notificationDependencies', dependencies: notificationDependencies })
      .catch(() => {
        if (requestedNotificationSnapshotRef.current === notificationDependencySnapshot) {
          requestedNotificationSnapshotRef.current = undefined;
        }
        console.warn('Error refreshing unsynced notification dependencies');
      });
  }, [notificationDependencies, notificationDependencySnapshot, requestFreshness, stillLoading]);

  useEffect(() => {
    if (stillLoading || _.isEmpty(notificationDependencies)) {
      return;
    }
    const heartbeat = setInterval(() => {
      requestFreshness({ reason: 'notificationDependencies', dependencies: notificationDependencies,
        heartbeat: true })
        .catch(() => console.warn('Error renewing unsynced notification dependencies'));
    }, NOTIFICATION_DEPENDENCY_HEARTBEAT_MS);
    return () => clearInterval(heartbeat);
  }, [notificationDependencies, requestFreshness, stillLoading]);

  const value = useMemo(() => ({ ...notificationSyncState, stillLoading }),
    [notificationSyncState, stillLoading]);

  return (
    <SyncedMessagesContext.Provider value={value}>
      {children}
    </SyncedMessagesContext.Provider>
  );
}

/**
 * The message list every display surface must use. Never use this for a sweep, clear or
 * dehighlight action; those read messagesState.messages so they can still reach an unsynced
 * message.
 */
export function useSyncedMessages() {
  const { syncedMessages } = useContext(SyncedMessagesContext);
  return syncedMessages;
}
