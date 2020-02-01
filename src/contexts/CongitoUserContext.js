import React, { useState, useEffect } from 'react';
import { Auth } from 'aws-amplify';
import _ from 'lodash';

const CognitoUserContext = React.createContext({});

function CognitoUserProvider(props) {
  const { children, authState } = props;
  const [user, setUser] = useState({});

  useEffect(() => {
    let isCanceled = false;
    if (_.isEmpty(user) && authState === 'signedIn') {
      Auth.currentAuthenticatedUser()
        .then((user) => {
          const { attributes } = user;
          if (isCanceled === false) {
            setUser(attributes);
          }
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
    <CognitoUserContext.Provider value={user}>
      {children}
    </CognitoUserContext.Provider>
  );
}

export { CognitoUserProvider, CognitoUserContext} ;