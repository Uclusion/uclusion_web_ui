import React, { useEffect, useState } from 'react'
import _ from 'lodash'
import { getSSOInfo } from '../api/sso'

export function isNewUser(user) {
  if (_.isEmpty(user)) {
    return undefined;
  }
  const { ui_preferences: uiPreferences } = user;
  return uiPreferences === 'new_signup';
}

const AccountUserContext = React.createContext({});

function AccountUserProvider(props) {
  const { children, authState } = props;
  const [user, setUser] = useState({});

  useEffect(() => {
    let isCanceled = false;
    if (_.isEmpty(user) && authState === 'signedIn') {
      getSSOInfo().then((ssoInfo) => {
        const { idToken, ssoClient } = ssoInfo;
        return ssoClient.accountCognitoLogin(idToken).then((loginInfo) => {
          const { user: myUser } = loginInfo;
          if (isCanceled === false) {
            setUser(myUser);
          }
        });
      });
    }
    if (user && authState !== 'signedIn') {
      setUser({});
    }
    return () => {
      isCanceled = true;
    }
  },[user, setUser, authState]);

  return (
    <AccountUserContext.Provider value={user}>
      {children}
    </AccountUserContext.Provider>
  );
}

export { AccountUserProvider, AccountUserContext};
