import React, { useState } from 'react';

const OnlineStateContext = React.createContext(true);

function OnlineStateProvider(props) {

  const { children } = props;
  const [online, setOnline] = useState(true);


  return (
    <OnlineStateContext.Provider value={[online, setOnline]}>
      {children}
    </OnlineStateContext.Provider>
  );
}

export { OnlineStateContext, OnlineStateProvider}