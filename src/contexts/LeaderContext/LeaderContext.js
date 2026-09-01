import React, { useCallback, useContext, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import reducer, { updateLeader } from './leaderContextReducer'
import {
  refreshVersions,
  refreshVersionsForNotificationDependencies,
  refreshVersionsFromPush,
  refreshVersionsNow,
  refreshVersionsOnce,
  stopRefreshRunner,
} from '../../api/versionedFetchUtils';
import { AccountContext } from '../AccountContext/AccountContext';
import { accountUserPresent, userIsLoaded } from '../AccountContext/accountUserContextHelper';
import { MarketsContext } from '../MarketsContext/MarketsContext';
import { MarketPresencesContext } from '../MarketPresencesContext/MarketPresencesContext';
import { MarketStagesContext } from '../MarketStagesContext/MarketStagesContext';
import { InvestiblesContext } from '../InvestibesContext/InvestiblesContext';
import { CommentsContext } from '../CommentsContext/CommentsContext';
import { MarketGroupsContext } from '../MarketGroupsContext/MarketGroupsContext';
import { GroupMembersContext } from '../GroupMembersContext/GroupMembersContext';
import { DiffContext } from '../DiffContext/DiffContext';
import { TicketIndexContext } from '../TicketContext/TicketIndexContext';
import { SearchIndexContext } from '../SearchIndexContext/SearchIndexContext';
import { isSignedOut, onSignOut } from '../../utils/userFunctions';
import { Tab } from 'tab-election';
import { NotificationsContext } from '../NotificationsContext/NotificationsContext';
import {
  configureFreshnessTab,
  createLeaderRefreshApi,
  FRESHNESS_NAMESPACES,
  handleReloadMessage,
  invalidateLocalLeaderRefresh,
  registerNamespaceReloader,
  reloadAllFromDisk,
  requestFreshness as requestTabFreshness,
  waitForPendingWrites,
} from '../../api/crossTabFreshness';
import { markDiskAdoptionComplete } from '../../api/syncStatus';

const EMPTY_STATE = {
  leader: undefined,
};

const EMPTY_API = {
  requestFreshness: () => Promise.resolve(false),
};
const LeaderContext = React.createContext([EMPTY_STATE, () => {}, EMPTY_API]);

let leaderContextHack = {};
export { leaderContextHack };

export const CLAIM_LEADERSHIP = 'claimLeadership';
export const LOGOUT = 'logout';
const LEADERSHIP_RETRY_START_MS = 1000;
const LEADERSHIP_RETRY_MAX_MS = 30000;

function LeaderProvider(props) {
  const { children, authState, userId } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [userState] = useContext(AccountContext);
  const [marketsState, marketsDispatch, , hydrateMarketsFromDisk, hydrateTokensFromDisk] =
    useContext(MarketsContext);
  const [, presenceDispatch, hydratePresencesFromDisk] = useContext(MarketPresencesContext);
  const [, marketStagesDispatch, hydrateStagesFromDisk] = useContext(MarketStagesContext);
  const [, investiblesDispatch, hydrateInvestiblesFromDisk] = useContext(InvestiblesContext);
  const [, commentsDispatch, hydrateCommentsFromDisk] = useContext(CommentsContext);
  const [, groupsDispatch, hydrateGroupsFromDisk] = useContext(MarketGroupsContext);
  const [, groupMembersDispatch, hydrateMembersFromDisk] = useContext(GroupMembersContext);
  const [, diffDispatch, hydrateDiffFromDisk] = useContext(DiffContext);
  const [, , , , hydrateNotificationsFromDisk] = useContext(NotificationsContext);
  const [, ticketsDispatch] = useContext(TicketIndexContext);
  const [index] = useContext(SearchIndexContext);
  const [myTab] = useState(() => new Tab('uclusion'));
  const electionStartedRef = useRef(false);
  const electionActiveRef = useRef(false);
  const runForLeadershipRef = useRef(undefined);
  const startLeadershipWaitRef = useRef(undefined);
  const leadershipAttemptRef = useRef(undefined);
  const refreshAsLeaderRef = useRef(undefined);
  const claimHandlingRef = useRef(undefined);
  const leadershipRetryTimerRef = useRef(undefined);
  const leadershipRetryDelayRef = useRef(LEADERSHIP_RETRY_START_MS);
  const diskAdoptedRef = useRef(false);
  const isUserLoaded = userIsLoaded(userState, marketsState);
  const hasAccountUser = accountUserPresent(userState);
  const { isLeader } = state;

  const dispatchers = useMemo(() => ({
    marketsDispatch,
    marketStagesDispatch,
    groupsDispatch,
    presenceDispatch,
    groupMembersDispatch,
    investiblesDispatch,
    commentsDispatch,
    diffDispatch,
    index,
    ticketsDispatch,
  }), [marketsDispatch, marketStagesDispatch, groupsDispatch, presenceDispatch,
    groupMembersDispatch, investiblesDispatch, commentsDispatch, diffDispatch, index, ticketsDispatch]);

  const recordDiskAdoption = useCallback(() => {
    diskAdoptedRef.current = true;
    markDiskAdoptionComplete();
  }, []);

  const reloadAll = useCallback(() => reloadAllFromDisk(), []);

  const refreshAsLeader = useCallback((request={}) => {
    if (request.reason === 'push') {
      return refreshVersionsFromPush(request.push);
    }
    if (request.reason === 'notificationDependencies') {
      // Remote calls expose their originating tab only while this API function is entered.
      // Scope full dependency snapshots by that id so one tab cannot clear another's marker.
      const sourceId = myTab.getCurrentCallerId() || myTab.id;
      return refreshVersionsForNotificationDependencies(request.dependencies, dispatchers, sourceId);
    }
    if (request.reason === 'missingData' || request.reason === 'missingDataPoll' ||
        request.reason === 'navigation' ||
        request.reason === 'manual' || request.reason === 'serverResponse') {
      return refreshVersionsNow(dispatchers);
    }
    return refreshVersions(dispatchers, request.skipIfRefreshedWithinMs);
  }, [dispatchers, myTab]);
  refreshAsLeaderRef.current = refreshAsLeader;

  const runForLeadership = useCallback(() => {
    const attempt = {};
    leadershipAttemptRef.current = attempt;
    let adoptionError;
    return myTab.waitForLeadership((relinquishLeadership) => {
      if (isSignedOut()) {
        console.info('Logging out after seeing leadership change');
        onSignOut()
          .catch((error) => console.warn('Error logging out after leadership change', error))
          .finally(relinquishLeadership);
        return {};
      }
      // Leadership cancels any follower-only fallback before disk replacement starts, so
      // stale network work cannot land between the replacement and enabling leader writes.
      stopRefreshRunner();
      console.info('Reloading disk state before claiming leadership');
      const adoption = reloadAll().then((reloaded) => {
        if (leadershipAttemptRef.current !== attempt || !myTab.isLeader) {
          throw new Error('Leadership changed during disk adoption');
        }
        if (!reloaded) {
          throw new Error('Disk adoption stopped before all contexts reloaded');
        }
        leadershipRetryDelayRef.current = LEADERSHIP_RETRY_START_MS;
        leaderContextHack = { ...leaderContextHack, isLeader: true };
        dispatch(updateLeader(true));
      });
      adoption.catch((error) => {
        adoptionError = error;
        if (leadershipAttemptRef.current === attempt) {
          invalidateLocalLeaderRefresh(myTab);
          relinquishLeadership();
        }
      });
      // Return the API immediately so tab-election can queue/call it on every reacquisition.
      // Its method still waits for disk adoption, so no refresh can write before replacement.
      return createLeaderRefreshApi((request) => {
        return adoption.then(() => {
          if (leadershipAttemptRef.current !== attempt || !myTab.isLeader) {
            throw new Error('Leadership changed before refresh');
          }
          return refreshAsLeaderRef.current(request);
        });
      });
    }).then((wasLeader) => {
      if (adoptionError && leadershipAttemptRef.current === attempt) {
        throw adoptionError;
      }
      return wasLeader;
    });
  }, [dispatch, myTab, reloadAll]);
  runForLeadershipRef.current = runForLeadership;

  const startLeadershipWait = useCallback(() => {
    if (leadershipRetryTimerRef.current) {
      clearTimeout(leadershipRetryTimerRef.current);
      leadershipRetryTimerRef.current = undefined;
    }
    return runForLeadershipRef.current().catch((error) => {
      console.warn('Leadership failed', error);
      if (electionActiveRef.current && !isSignedOut() && !leadershipRetryTimerRef.current) {
        const delay = leadershipRetryDelayRef.current;
        leadershipRetryDelayRef.current = Math.min(delay * 2, LEADERSHIP_RETRY_MAX_MS);
        leadershipRetryTimerRef.current = setTimeout(() => {
          leadershipRetryTimerRef.current = undefined;
          if (electionActiveRef.current) {
            startLeadershipWaitRef.current();
          }
        }, delay);
      }
      return false;
    });
  }, []);
  startLeadershipWaitRef.current = startLeadershipWait;

  const requestFreshness = useCallback((request={}) => requestTabFreshness(request), []);

  useEffect(() => {
    const unregister = [
      configureFreshnessTab(myTab, recordDiskAdoption),
      registerNamespaceReloader(FRESHNESS_NAMESPACES.MARKETS, hydrateMarketsFromDisk),
      registerNamespaceReloader(FRESHNESS_NAMESPACES.TOKENS, hydrateTokensFromDisk),
      registerNamespaceReloader(FRESHNESS_NAMESPACES.COMMENTS, hydrateCommentsFromDisk),
      registerNamespaceReloader(FRESHNESS_NAMESPACES.INVESTIBLES, hydrateInvestiblesFromDisk),
      registerNamespaceReloader(FRESHNESS_NAMESPACES.PRESENCES, hydratePresencesFromDisk),
      registerNamespaceReloader(FRESHNESS_NAMESPACES.STAGES, hydrateStagesFromDisk),
      registerNamespaceReloader(FRESHNESS_NAMESPACES.GROUPS, hydrateGroupsFromDisk),
      registerNamespaceReloader(FRESHNESS_NAMESPACES.MEMBERS, hydrateMembersFromDisk),
      registerNamespaceReloader(FRESHNESS_NAMESPACES.NOTIFICATIONS, hydrateNotificationsFromDisk),
      registerNamespaceReloader(FRESHNESS_NAMESPACES.DIFF, hydrateDiffFromDisk),
    ];
    return () => unregister.reverse().forEach((remove) => remove());
  }, [myTab, recordDiskAdoption, hydrateMarketsFromDisk, hydrateTokensFromDisk, hydrateCommentsFromDisk,
    hydrateInvestiblesFromDisk, hydratePresencesFromDisk, hydrateStagesFromDisk,
    hydrateGroupsFromDisk, hydrateMembersFromDisk, hydrateNotificationsFromDisk, hydrateDiffFromDisk]);

  useEffect(() => {
    if (authState === 'signedIn' && userId && !electionStartedRef.current) {
      electionStartedRef.current = true;
      electionActiveRef.current = true;
      const handleMessage = (event) => {
        console.info('Received tab message: ', event.data);
        if (event.data === CLAIM_LEADERSHIP) {
          // B-all-446 a newly opened tab is grabbing leadership because it is known fresh.
          // waitForLeadership relinquishes any held or queued leadership before requesting,
          // so this re-queues behind the new tab and gets leadership back if it closes.
          if (!claimHandlingRef.current) {
            leadershipAttemptRef.current = undefined;
            invalidateLocalLeaderRefresh(myTab);
            leaderContextHack = { ...leaderContextHack, isLeader: false };
            dispatch(updateLeader(false));
            stopRefreshRunner();
            claimHandlingRef.current = waitForPendingWrites()
              .catch((error) => console.warn('Error draining leader writes', error))
              .then(() => {
                if (electionActiveRef.current) {
                  startLeadershipWaitRef.current();
                }
              })
              .finally(() => {
                claimHandlingRef.current = undefined;
              });
          }
        } else if (event.data === LOGOUT) {
          onSignOut().then(() => console.info('Done logging out'));
        } else {
          const reload = handleReloadMessage(event.data);
          if (reload) {
            reload.catch((error) => console.warn('Error reloading cross-tab state', error));
          }
        }
      };
      myTab.addEventListener('message', handleMessage);
      startLeadershipWaitRef.current();
      // B-all-446 take leadership from existing tabs - the old leader may have missed a sync
      // notification or be in a weird state, and only this tab is guaranteed fresh. Must be
      // sent after runForLeadership so this tab's lock request precedes the re-queues.
      myTab.send(CLAIM_LEADERSHIP);
      return () => {
        electionActiveRef.current = false;
        electionStartedRef.current = false;
        leadershipAttemptRef.current = undefined;
        invalidateLocalLeaderRefresh(myTab);
        leaderContextHack = { ...leaderContextHack, isLeader: false };
        dispatch(updateLeader(false));
        stopRefreshRunner();
        myTab.removeEventListener('message', handleMessage);
        if (leadershipRetryTimerRef.current) {
          clearTimeout(leadershipRetryTimerRef.current);
          leadershipRetryTimerRef.current = undefined;
        }
        leadershipRetryDelayRef.current = LEADERSHIP_RETRY_START_MS;
        waitForPendingWrites()
          .catch((error) => console.warn('Error draining writes while closing leadership', error))
          .finally(() => {
            if (!electionActiveRef.current) {
              myTab.close();
            }
          });
      };
    }
    return () => {};
  }, [authState, myTab, userId]);

  useEffect(() => {
    if (authState !== 'signedIn') {
      console.info('Sending logout');
      myTab.send(LOGOUT);
      myTab.close();
      window.location.reload(true);
    }
  }, [authState, myTab]);

  useEffect(() => {
    if (!isUserLoaded && isLeader && hasAccountUser) {
      // S-all-230: a stale NEEDS_ONBOARDING flag otherwise deadlocks startup - the sync is
      // gated on userIsLoaded, which waits for a planning market that only the sync can load.
      // After a grace period for normal onboarding to finish, refresh anyway so the client
      // recovers; a mid-onboarding sync just loads what exists and pushes fill in the rest.
      const timer = setTimeout(() => {
        console.warn('Refreshing versions despite onboarding state');
        refreshVersionsNow(dispatchers).catch(() => console.warn('Error refreshing'));
      }, 15000);
      return () => clearTimeout(timer);
    }
    if (isUserLoaded) {
      if (isLeader) {
        console.info('Leadership refreshing versions');
        // Try use set timeout and dispatchers for stability but my have to move to suspend
        const timer = setTimeout(() => refreshVersionsNow(dispatchers).then(() => {
          console.info('Refreshed versions from leader init');
        }).catch(() => console.warn('Error refreshing')), 0);
        return () => clearTimeout(timer);
      } else {
        // T-all-2153 a new tab must promptly fetch data even when the leadership claim stalls
        // (a wedged old leader never relinquishes the lock). Fetch to memory after a grace
        // period unless leadership arrives first and does the full refresh to disk.
        reloadAll().catch(() => console.warn('Error reloading follower state'));
        const timer = setTimeout(() => {
          if (!diskAdoptedRef.current && !myTab.isLeader) {
            console.info('Refreshing versions once without leadership');
            refreshVersionsOnce(dispatchers).catch(() => console.warn('Error refreshing'));
          }
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
    return () => {};
  }, [isUserLoaded, isLeader, hasAccountUser, dispatchers, myTab, reloadAll]);
  leaderContextHack = state;
  return (
    <LeaderContext.Provider value={[state, dispatch, { requestFreshness }]}>
      {children}
    </LeaderContext.Provider>
  );
}

export { LeaderProvider, LeaderContext };
