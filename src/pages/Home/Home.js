import React, { useEffect } from 'react'
import { useHistory } from 'react-router';
import _ from 'lodash'
import Screen from '../../containers/Screen/Screen'
import { clearRedirect, getRedirect } from '../../utils/redirectUtils'

function Home() {
  const history = useHistory();

  useEffect(() => {
    const redirect = getRedirect();
    clearRedirect();
    if (!_.isEmpty(redirect) && redirect !== '/') {
      console.log(`Redirecting you to ${redirect}`);
      history.push(redirect);
    } else {
      history.push('/inbox');
    }
  });

  return (
    <Screen
      hidden={false}
      loading={true}
    />
  );
}

export default Home;
