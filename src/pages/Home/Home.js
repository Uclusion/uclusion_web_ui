import React, { useContext, useEffect } from 'react'
import { useHistory } from 'react-router';
import _ from 'lodash'
import Screen from '../../containers/Screen/Screen'
import { getRedirect } from '../../utils/redirectUtils'
import { INVITED_USER_WORKSPACE } from '../../contexts/TourContext/tourContextHelper'
import { TourContext } from '../../contexts/TourContext/TourContext'
import { startTour } from '../../contexts/TourContext/tourContextReducer'

function Home() {
  const history = useHistory();
  const [, tourDispatch] = useContext(TourContext);

  useEffect(() => {
    const redirect = getRedirect();
    if (!_.isEmpty(redirect) && redirect !== '/') {
      // Go ahead and start the invite tour - if they have taken already it's harmless
      tourDispatch(startTour(INVITED_USER_WORKSPACE));
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
