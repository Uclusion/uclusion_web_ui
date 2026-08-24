import { useContext, useEffect, useRef } from 'react';
import { useLocation } from 'react-router';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { loadMarketById } from '../../contexts/MarketsContext/marketsContextMessages';
import {
  getLogoutGeneration,
  isLogoutGenerationCurrent,
  isSignedOut,
} from '../../utils/logoutState';
import { toastError } from '../../utils/userMessage';

function SetupWorkspaceLoad() {
  const { state } = useLocation();
  const setupWorkspaceId = state?.setupWorkspaceId;
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const loadedWorkspace = useRef();

  useEffect(() => {
    if (!setupWorkspaceId || marketsState.initializing ||
      loadedWorkspace.current === setupWorkspaceId) {
      return undefined;
    }
    let active = true;
    const logoutGeneration = getLogoutGeneration();
    const activityGuard = () => active && !isSignedOut() &&
      isLogoutGenerationCurrent(logoutGeneration);
    loadMarketById(setupWorkspaceId, marketsDispatch, activityGuard).then(() => {
      if (activityGuard()) {
        loadedWorkspace.current = setupWorkspaceId;
      }
    }).catch((error) => {
      if (activityGuard() && !error?.cancelled) {
        toastError(error, 'setupWorkspaceOpenFailed');
      }
    });
    return () => {
      active = false;
    };
  }, [marketsDispatch, marketsState.initializing, setupWorkspaceId]);

  return null;
}

export default SetupWorkspaceLoad;
