import React, { useContext, useState } from 'react';
import { MARKET_MESSAGE_EVENT, VERSIONS_HUB_CHANNEL } from '../../contexts/WebSocketContext';
import { Hub } from '@aws-amplify/core';
import { CircularProgress, useTheme } from '@material-ui/core';
import PropTypes from 'prop-types';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';

const FETCH_DELAY = 40; // give us 40 ms pull data from the hub event;

export function withSpinLock(Component) {
  const Spinning = function (props) {
    const {
      marketId,
      onSpinStart,
      onSpinStop,
      onClick,
      children,
      disabled,
      ...rest
    } = props;

    const theme = useTheme();

    const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
    const [spinning, setSpinning] = useState(false);

    const hubListener = (data) => {
      const { payload: { event, message } } = data;
      switch (event) {
        case MARKET_MESSAGE_EVENT:
          const { object_id: messageMarketId } = message;
          if (messageMarketId === marketId) {
            myOnSpinStop();
          }
          break;
        default:
          // ignore
          console.debug(`Spin blocker ignoring ${event}`);
          break;
      }
    };

    function myOnSpinStart() {
      setOperationRunning(true);
      setSpinning(true);
      Hub.listen(VERSIONS_HUB_CHANNEL, hubListener);
      onSpinStart();
    }

    function myOnSpinStop() {
      Hub.remove(VERSIONS_HUB_CHANNEL, hubListener);
      setTimeout(() => {
        setSpinning(false);
        setOperationRunning(false);
        onSpinStop();
      }, FETCH_DELAY);

    }

    function myOnClick() {
      myOnSpinStart();
      onClick();
    }

    return (
      <Component
        disabled={disabled || operationRunning || spinning}
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
    disabled: PropTypes.bool,
  };
  Spinning.defaultProps = {
    onSpinStart: () => {
    },
    onSpinStop: () => {
    },
    onClick: () => {
    },
    disabled: false,
  };
  return Spinning;
}
