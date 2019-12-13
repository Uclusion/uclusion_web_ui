import React, { useState } from 'react';
import { MARKET_MESSAGE_EVENT, VERSIONS_HUB_CHANNEL } from '../../contexts/WebSocketContext';
import { Hub } from '@aws-amplify/core';
import { CircularProgress, useTheme } from '@material-ui/core';
import PropTypes from 'prop-types';

const FETCH_DELAY = 40; // give us 40 ms pull data from the hub event;

export function withSpinLock(Component) {
  const Spinning = function (props) {
    const {
      marketId,
      onSpinStart,
      onSpinStop,
      onClick,
      children,
      ...rest
    } = props;

    const theme = useTheme();

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
      <Component
        disabled={spinning}
        onClick={myOnClick}
        {...rest}
      >
        {spinning && (
          <CircularProgress
            size={theme.typography.fontSize}
            color="inherit"
          />
        )}
        {!spinning && children}
      </Component>
    );
  };
  Spinning.propTypes = {
    onSpinStart: PropTypes.func,
    onSpinStop: PropTypes.func,
    onClick: PropTypes.func,
    marketId: PropTypes.string.isRequired,
    children: PropTypes.node.isRequired,
  };
  Spinning.defaultProps = {
    onSpinStart: () => {
    },
    onSpinStop: () => {
    },
    onClick: () => {
    },
  };
  return Spinning;
}
