import React, { useContext, useEffect, useReducer, useRef, useState } from 'react';
import reducer, { updateLeader } from './leaderContextReducer'
import { refreshNotifications, refreshVersions } from '../../api/versionedFetchUtils';
import { AccountContext } from '../AccountContext/AccountContext';
import { userIsLoaded } from '../AccountContext/accountUserContextHelper';
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

const EMPTY_STATE = {
  leader: undefined,
};

const LeaderContext = React.createContext(EMPTY_STATE);

let leaderContextHack = {};
export { leaderContextHack };

export const CLAIM_LEADERSHIP = 'claimLeadership';
export const LOGOUT = 'logout';

function runForLeadership(tab, dispatch) {
  return tab.waitForLeadership(() => {
    if (isSignedOut()) {
      console.info('Logging out after seeing leadership change');
      onSignOut().then(() => console.info('Done logging out'));
    } else {
      console.info(`Claiming leadership`);
      // Could use broadcast ID to send message out to others to refresh out of login page
      // but its a bit risky as can somehow infinite refresh and corner of corner case anyway
      dispatch(updateLeader(true));
    }
  });
}

function LeaderProvider(props) {
  const { children, authState, userId } = props;
  const [state, dispatch] = useReducer(reducer, EMPTY_STATE);
  const [userState] = useContext(AccountContext);
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [, marketStagesDispatch] = useContext(MarketStagesContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, commentsDispatch] = useContext(CommentsContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, groupMembersDispatch] = useContext(GroupMembersContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, ticketsDispatch] = useContext(TicketIndexContext);
  const [index] = useContext(SearchIndexContext);
  const [myTab, setMyTab] = useState(new Tab('uclusion'));
  const electionStartedRef = useRef(false);
  const isUserLoaded = userIsLoaded(userState, marketsState);
  const { isLeader } = state;

  useEffect(() => {
    if (authState === 'signedIn' && userId && !electionStartedRef.current) {
      electionStartedRef.current = true;
      myTab.addEventListener('message', (event) => {
        console.info('Received tab message: ', event.data);
        if (event.data === CLAIM_LEADERSHIP) {
          // B-all-446 a newly opened tab is grabbing leadership because it is known fresh.
          // waitForLeadership relinquishes any held or queued leadership before requesting,
          // so this re-queues behind the new tab and gets leadership back if it closes.
          dispatch(updateLeader(false));
          runForLeadership(myTab, dispatch);
        } else if (event.data === LOGOUT) {
          onSignOut().then(() => console.info('Done logging out'));
        }
      });
      runForLeadership(myTab, dispatch);
      // B-all-446 take leadership from existing tabs - the old leader may have missed a sync
      // notification or be in a weird state, and only this tab is guaranteed fresh. Must be
      // sent after runForLeadership so this tab's lock request precedes the re-queues.
      myTab.send(CLAIM_LEADERSHIP);
    }
    return () => {};
  }, [authState, myTab, setMyTab, userId]);

  useEffect(() => {
    if (authState !== 'signedIn') {
      console.info('Sending logout');
      myTab.send(LOGOUT);
      myTab.close();
      window.location.reload(true);
    }
  }, [authState, myTab]);

  useEffect(() => {
    if (isUserLoaded) {
      const dispatchers = { marketsDispatch, marketStagesDispatch, groupsDispatch, presenceDispatch,
        groupMembersDispatch, investiblesDispatch, commentsDispatch, diffDispatch, index, ticketsDispatch };
      if (isLeader) {
        console.info('Leadership refreshing versions');
        // Try use set timeout and dispatchers for stability but my have to move to suspend
        setTimeout(() => refreshVersions(dispatchers).then(() => {
          console.info('Refreshed versions from leader init');
        }).catch(() => console.warn('Error refreshing')), 0);
      } else {
        // Required to get initialized true in notifications context plus really don't need a leader for notifications
        refreshNotifications();
        // T-all-2153 a new tab must promptly fetch data even when the leadership claim stalls
        // (a wedged old leader never relinquishes the lock). Fetch to memory after a grace
        // period unless leadership arrives first and does the full refresh to disk.
        const timer = setTimeout(() => {
          console.info('Refreshing versions without leadership');
          refreshVersions(dispatchers).catch(() => console.warn('Error refreshing'));
        }, 3000);
        return () => clearTimeout(timer);
      }
    }
    return () => {};
  }, [isUserLoaded, isLeader, marketsDispatch, marketStagesDispatch, groupsDispatch, presenceDispatch,
    groupMembersDispatch, investiblesDispatch, commentsDispatch, diffDispatch, index, ticketsDispatch]);
  leaderContextHack = state;
  return (
    <LeaderContext.Provider value={[state, dispatch]}>
      {children}
    </LeaderContext.Provider>
  );
}

export { LeaderProvider, LeaderContext };
