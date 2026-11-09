import React, { createContext, useContext, useEffect, useMemo, useRef } from 'react';
import _ from 'lodash';
import { NotificationsContext, NotificationsRefreshContext } from '../NotificationsContext/NotificationsContext';
import { getNotificationSyncState, isInInbox } from '../NotificationsContext/notificationsContextHelper';
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
import { refreshNotifications } from '../../api/versionedFetchUtils';

const NOTIFICATION_DEPENDENCY_HEARTBEAT_MS = 60000;

const EMPTY_SYNC_STATE = { syncedMessages: [], dependencies: [] };

export const SyncedMessagesContext = createContext({ ...EMPTY_SYNC_STATE, stillLoading: true });
export const SyncedMessagesStatusContext = createContext({ messagesSyncing: false, refreshError: false });

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
  const notificationRefresh = useContext(NotificationsRefreshContext);
  const { refreshed: notificationsRefreshed, refreshing, refreshError } = notificationRefresh;
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
  const waitingForData = !initialSyncComplete || !notificationsInitialized || marketsState.initializing ||
    !_.isEmpty((myNotHiddenMarketsState.marketDetails || []).find((market) =>
      !marketTokenLoaded(market.id, tokensHash)));

  // A disk snapshot can be from a previous mobile session. Fetch this tab's initial message
  // list as soon as its data is usable, including when another tab owns the version refresh.
  useEffect(() => {
    if (!waitingForData && !notificationsRefreshed) {
      refreshNotifications({ onlyIfIdle: true });
    }
  }, [waitingForData, notificationsRefreshed, leaderState?.isLeader]);

  const notificationSyncState = useMemo(() => waitingForData ? EMPTY_SYNC_STATE :
    getNotificationSyncState(messages, marketsState, marketPresencesState, commentsState,
      investiblesState, groupsState), [commentsState, groupsState, investiblesState,
    marketPresencesState, marketsState, messages, waitingForData]);
  const { dependencies: notificationDependencies } = notificationSyncState;
  const stillLoading = waitingForData || (!notificationsRefreshed && !refreshError);
  // Keep a visible sync indicator until every row is usable. A missing object can outlive the
  // bounded retry budget, so it must not prevent opening or clearing the rest of the inbox.
  const messagesSyncing = !waitingForData &&
    (refreshing || notificationSyncState.syncedMessages.length !== (messages || []).filter(isInInbox).length);

  // Recovery lives here rather than in NavigationChevrons so a notification whose data has not
  // landed is chased whether or not that component is mounted.
  // Keyed on leadership too, so becoming leader re-requests rather than sitting on a snapshot
  // that a follower already recorded.
  const notificationDependencySnapshot = `${leaderState?.isLeader}|${JSON.stringify(notificationDependencies)}`;
  const requestedNotificationSnapshotRef = useRef(undefined);
  useEffect(() => {
    if (waitingForData || requestedNotificationSnapshotRef.current === notificationDependencySnapshot) {
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
  }, [notificationDependencies, notificationDependencySnapshot, requestFreshness, waitingForData]);

  useEffect(() => {
    if (waitingForData || _.isEmpty(notificationDependencies)) {
      return;
    }
    const heartbeat = setInterval(() => {
      requestFreshness({ reason: 'notificationDependencies', dependencies: notificationDependencies,
        heartbeat: true })
        .catch(() => console.warn('Error renewing unsynced notification dependencies'));
    }, NOTIFICATION_DEPENDENCY_HEARTBEAT_MS);
    return () => clearInterval(heartbeat);
  }, [notificationDependencies, requestFreshness, waitingForData]);

  const value = useMemo(() => ({ ...notificationSyncState, stillLoading }),
    [notificationSyncState, stillLoading]);
  const status = useMemo(() => ({ messagesSyncing, refreshError }), [messagesSyncing, refreshError]);

  return (
    <SyncedMessagesContext.Provider value={value}>
      <SyncedMessagesStatusContext.Provider value={status}>
        {children}
      </SyncedMessagesStatusContext.Provider>
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
