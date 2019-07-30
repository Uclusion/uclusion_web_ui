import React from 'react';
import { Scrollbars } from 'react-custom-scrollbars';


const Scrollbar = (props) => {
  const { ...rest } = props;

  /*  const thumbStyle = {
    backgroundColor: theme.palette.primary.dark,
    borderRadius: 3
  }
*/
  return (
    <Scrollbars
      // renderThumbVertical={({ style, ...p }) => <div style={{ ...style, ...thumbStyle }} {...p} />}
      {...rest}
    />
  );
};

export default Scrollbar;
