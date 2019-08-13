import React, { useState } from 'react';


const InvestiblesContext = React.createContext([{}, () => {}]);


function InvestiblesProvider(props) {

  const [state, setState] = useState({});

  return (
    <InvestiblesContext.Provider value={[state, setState]} >
      { props.children }
    </InvestiblesContext.Provider>
  );
}

export { InvestiblesContext, InvestiblesProvider };


