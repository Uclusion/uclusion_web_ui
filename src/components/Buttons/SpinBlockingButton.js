import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Hub } from '@aws-amplify/core';
import { MARKET_MESSAGE_EVENT, VERSIONS_HUB_CHANNEL } from '../../contexts/WebSocketContext';
import { Button, CircularProgress } from '@material-ui/core';

const FETCH_DELAY = 40; //give the backend 40 ms to do it's fetches;

/**
 * Spin blocking buttons spin until they receive a hub event for the given market id
 * @param props
 * @constructor
 */
function SpinBlockingButton(props) {

  const {
    marketId,
    onSpinStart,
    onSpinStop,
    onClick,
    children,
    ...rest
  } = props;

  const [spinning, setSpinning] = useState(false);

  const hubListener = (data) => {
    console.log(data);
    const { payload: { event, message } } = data;
    switch (event) {
      case MARKET_MESSAGE_EVENT:
        const { object_id: messageMarketId } = message;
        if (messageMarketId === marketId) {
          myOnSpinStop();
        }
        break;
      default:
        //ignore
        break;
    }
  };

  function myOnSpinStart() {
    setSpinning(true);
    Hub.listen(VERSIONS_HUB_CHANNEL, hubListener);
    onSpinStart();
  }

  function myOnSpinStop() {
    Hub.remove(VERSIONS_HUB_CHANNEL, hubListener);
    setTimeout(() => {
      setSpinning(false);
      onSpinStop();
    }, FETCH_DELAY);

  }


  function myOnClick() {
    myOnSpinStart();
    onClick();
  }

  return (
    <Button
      onClick={myOnClick}
      disabled={spinning}
      {...rest}
    >
      {spinning && <CircularProgress color='#ffffff' /> }
      {!spinning && children}
    </Button>
  );
}

SpinBlockingButton.propTypes = {
  onSpinStart: PropTypes.func,
  onSpinStop: PropTypes.func,
  onClick: PropTypes.func,
  marketId: PropTypes.string.isRequired,
  children: PropTypes.node.isRequired,
};

SpinBlockingButton.defaultProps = {
  onSpinStart: () => {},
  onSpinStop: () => {},
  onClick: () => {},
};

export default SpinBlockingButton;

