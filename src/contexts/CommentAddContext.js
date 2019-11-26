import React, { useState, useRef } from 'react';


const EMPTY_STATE = {hidden: true, type: null, allowedTypes:[]};
const CommentAddContext = React.createContext(EMPTY_STATE);

function CommentAddProvider(props) {
  const ref = useRef(null);
  const { children } = props;
  const [state, setState] = useState({...EMPTY_STATE, ref});
  return (
    <CommentAddContext.Provider value={[state, setState]}>
      { children }
    </CommentAddContext.Provider>
  );
}

export { CommentAddContext, CommentAddProvider };
