import React, { useContext, useState } from 'react'
import { toastError } from '../../utils/userMessage'
import { CircularProgress, useTheme } from '@material-ui/core'
import PropTypes from 'prop-types'
import { MARKET_MESSAGE_EVENT, VERSIONS_HUB_CHANNEL } from '../../contexts/WebSocketContext'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { registerListener, removeListener } from '../../utils/MessageBusUtils'
import { refreshGlobalVersion } from '../../api/versionedFetchUtils';

const SPIN_CHECKER_POLL_DELAY = 75; // how often to run the spin checker

export function withSpinLock(Component) {
  const Spinning = function (props) {
    const {
      marketId,
      onSpinStart,
      onSpinStop,
      onClick,
      onError,
      children,
      disabled,
      hasSpinChecker,
      spanChildren,
      ...rest
    } = props;

    const theme = useTheme();
    const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
    const [spinning, setSpinning] = useState(false);
    const listenerName = 'SPINNER';


    function endSpinning(result) {
      setSpinning(false);
      setOperationRunning(false);
      // console.log(`Calling on spin stop with ${result}`);
      onSpinStop(result);
    }

    /**
     * Only called if you don't have a spin checker
     */
    function myOnSpinStop(result) {
      // if we don't have a spin checker, then just stop spinning and
      // force a refresh (which will have it's own spin stuff)
      endSpinning(result);
      refreshGlobalVersion();
    }

    function myOnError(error) {
      toastError('spinVersionCheckError');
      setSpinning(false);
      setOperationRunning(false);
      onError(error);
    }


    const hubListener = (data) => {
      const { payload: { event, marketId: messageMarketId } } = data;
      switch (event) {
        case MARKET_MESSAGE_EVENT: {
          if (messageMarketId === marketId) {
            myOnSpinStop();
          }
          break;
        }
        default:
          // ignore
          // console.debug(`Spin blocker ignoring ${event}`);
          break;
      }
    };

    function myOnSpinStart() {
      setOperationRunning(true);
      setSpinning(true);
      if (!hasSpinChecker) {
        registerListener(VERSIONS_HUB_CHANNEL, listenerName, hubListener);
      }
      onSpinStart();
    }

    function myOnClick() {
      myOnSpinStart();
      // the promise.resolve will nicely wrap non promises into a promise so we can use catch
      // to stop spinning on error
      return Promise.resolve(onClick())
        .then((result) => {
          if (result !== undefined) {
            const { spinChecker, result: operationResult } = result;
            if (spinChecker) {
              // if we have a spin checker we'll use it instead of our listener
              removeListener(VERSIONS_HUB_CHANNEL, listenerName);
              function spinCheck() {
                spinChecker()
                  .then((checkResult) => {
                    if (checkResult) {
                //      console.error('Ending Spinning By Checker');
                      endSpinning(operationResult);
                    } else {
                      setTimeout(spinCheck, SPIN_CHECKER_POLL_DELAY);
                    }
                  })
                  .catch((error) => {
                    myOnError(error);
                  });
              }
              setTimeout(spinCheck, SPIN_CHECKER_POLL_DELAY);
            } else {
              myOnSpinStop(result);
            }
          } else {
            myOnSpinStop(result);
          }
        })
        .catch((error) => {
          myOnError(error);
        });
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
        {!spanChildren && !spinning && children}
        {/* keep the children in layout to avoid vertical layout shifts */}
        {spanChildren && (
          <span style={{ visibility: spinning ? 'hidden' : 'visible'  }}>{children}</span>
        )}
      </Component>
    );
  };
  Spinning.propTypes = {
    onSpinStart: PropTypes.func,
    onSpinStop: PropTypes.func,
    onClick: PropTypes.func,
    onError: PropTypes.func,
    // eslint-disable-next-line react/forbid-prop-types
    marketId: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    // are we giving you a spin checker, so don't wait for messages
    hasSpinChecker: PropTypes.bool,
    spanChildren: PropTypes.bool,
  };
  Spinning.defaultProps = {
    onSpinStart: () => {
    },
    onSpinStop: () => {
    },
    onClick: () => {
    },
    onError: () => {
    },
    disabled: false,
    hasSpinChecker: false,
    spanChildren: true,
  };
  return Spinning;
}
