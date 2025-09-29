import React, { useState } from 'react';

const OnlineStateContext = React.createContext(true);

function OnlineStateProvider(props) {

  const { children } = props;
  const [online, setOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);


  return (
    <OnlineStateContext.Provider value={[online, setOnline, showOfflineMessage, setShowOfflineMessage]}>
      {children}
    </OnlineStateContext.Provider>
  );
}

export { OnlineStateContext, OnlineStateProvider}