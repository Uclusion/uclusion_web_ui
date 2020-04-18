import React, { useContext, useState } from 'react';
import { toastError } from '../../utils/userMessage';
import { CircularProgress, useTheme } from '@material-ui/core';
import PropTypes from 'prop-types';
import { MARKET_MESSAGE_EVENT, VERSIONS_HUB_CHANNEL } from '../../contexts/WebSocketContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { pushMessage, registerListener, removeListener } from '../../utils/MessageBusUtils';
import { getExistingMarkets, getGlobalVersion } from '../../contexts/VersionsContext/versionsContextHelper';
import { VersionsContext } from '../../contexts/VersionsContext/VersionsContext';
import { startTimerChain } from '../../utils/timerUtils';
import { doVersionRefresh, MatchError } from '../../api/versionedFetchUtils';
import { GLOBAL_VERSION_UPDATE } from '../../contexts/VersionsContext/versionsContextMessages';

const FETCH_DELAY = 200; // give us 200 ms pull data from the hub event;
const SPIN_CHECKER_POLL_DELAY = 75; // how often to run the spin checker
// if an operation isn't cancelled within the operation timeout period, we're going to force
// a versions check and see if one has happenedourselves.
const OPERATION_TIMEOUT = 1500; // Time to wait before trying the first poll attempt

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
    const [versionsState] = useContext(VersionsContext);
    const [spinning, setSpinning] = useState(false);
    const listenerName = 'SPINNER';

    function operationCheckStopper() {
      removeListener(VERSIONS_HUB_CHANNEL, listenerName);
    }

    function endSpinning(result) {
      setSpinning(false);
      setOperationRunning(false);
      // console.log(`Calling on spin stop with ${result}`);
      onSpinStop(result);
    }

    function myOnSpinStop() {
      operationCheckStopper();
      setTimeout(() => {
        endSpinning();
      }, FETCH_DELAY);
    }

    function myOnError(error) {
      toastError('spinVersionCheckError');
      operationCheckStopper();
      setSpinning(false);
      setOperationRunning(false);
      onError(error);
    }

    /**
     * Starts a timer for the overall operation. If it goes
     * off then we force version check.
     */
    function startOperationCheckInterval() {
      // const currentVersion = getMarketVersion(versionsState, marketId);
      const globalVersion = getGlobalVersion(versionsState);
      const existingMarkets = getExistingMarkets(versionsState);
      startTimerChain(OPERATION_TIMEOUT, 20, () => {
        // console.debug('Operation check interval firing');
        return doVersionRefresh(globalVersion, existingMarkets)
          .then((newGlobalVersion) => {
            if (globalVersion !== newGlobalVersion ) {
              pushMessage(VERSIONS_HUB_CHANNEL, {event: GLOBAL_VERSION_UPDATE, globalVersion: newGlobalVersion});
            }
            return true;
          })
          .catch((error) => {
            if (!(error instanceof MatchError)) {
              myOnError();
            } else {
              return false;
            }
          });
      });
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
      startOperationCheckInterval();
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
                      operationCheckStopper();
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
            }
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
