import React, { useState } from 'react'

/**
 * Simple context so all the screens who want to pop the same banner across the site
 * can update it in one locaiton. A portal or state change on screen might work just as
 * well.
 */

const EMPTY_STATE = null;
const BannerContext = React.createContext(EMPTY_STATE);

function BannerProvider(props) {
  const { children } = props;
  const [state, setState] = useState(EMPTY_STATE);

  return (
    <BannerContext.Provider value={[state, setState]}>
      {children}
    </BannerContext.Provider>
  );
}

export { BannerContext, BannerProvider };