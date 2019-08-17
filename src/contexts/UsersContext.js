import React, { useState, useEffect } from 'react';
import { Hub } from 'aws-amplify';


const UsersContext = React.createContext([{}, () => {}]);

const USERS_CONTEXT_KEY = 'users_context';

function UsersProvider(props) {

  const { children } = props;
  const [state, setState] = useState({});


  return (
    <UsersContext.Provider value={[state, setState]}>
      { children }
    </UsersContext.Provider>
  );
}

export { UsersContext, UsersProvider };
