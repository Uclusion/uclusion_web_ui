import React, { useEffect, useReducer, useState } from 'react';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../../components/utils';
import { reducer } from './accountContextReducer';
import { beginListening } from './accountContextMessages';
import _ from 'lodash';
import { getHomeAccountUser } from '../../api/sso';
import { homeUserRefresh } from './userPreferencesContextReducer';

const EMPTY_STATE = {};
const UserPreferencesContext = React.createContext(EMPTY_STATE);

const USER_PREFERENCES_CONTEXT_KEY = 'user_preferences_context';

/** This is backed by local storage instead of index db, because I'm never
 * storing more than the user preferences info here, and it's small
 * @param props
 * @constructor
 */
function UserPreferencesProvider (props) {
  const { children } = props;
  const defaultValue = getUclusionLocalStorageItem(USER_PREFERENCES_CONTEXT_KEY) || EMPTY_STATE;
  const [state, dispatch] = useReducer(reducer, defaultValue);
  const [isInitialization, setIsInitialization] = useState(true);

  useEffect(() => {
    setUclusionLocalStorageItem(USER_PREFERENCES_CONTEXT_KEY, state);
    if (isInitialization) {
      beginListening(dispatch);
      getHomeAccountUser()
        .then((user) => {
          dispatch(homeUserRefresh(user));
        });
      setIsInitialization(false);
    }
  }, [state, isInitialization, dispatch, setIsInitialization]);

  return (
    <UserPreferencesProvider.Provider value={[state, dispatch]}>
      {children}
    </UserPreferencesProvider.Provider>
  );
}

export { UserPreferencesContext, UserPreferencesProvider };