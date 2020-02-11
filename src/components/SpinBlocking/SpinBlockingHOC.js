import React, { useContext, useState } from 'react';
import _ from 'lodash';
import { CircularProgress, useTheme } from '@material-ui/core';
import PropTypes from 'prop-types';
import { MARKET_MESSAGE_EVENT, VERSIONS_HUB_CHANNEL } from '../../contexts/WebSocketContext';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import { registerListener, removeListener } from '../../utils/MessageBusUtils';
import { getMarketVersion } from '../../contexts/VersionsContext/versionsContextHelper';
import { VersionsContext } from '../../contexts/VersionsContext/VersionsContext';
import { getVersions } from '../../api/summaries';
import { toastErrorAndThrow } from '../../utils/userMessage';
import { refreshVersionsAction } from '../../contexts/VersionsContext/versionsContextReducer';
import { startTimerChain } from '../../utils/timerUtils';

const FETCH_DELAY = 200; // give us 200 ms pull data from the hub event;
const SPIN_CHECKER_POLL_DELAY = 10; // how often to run the spin checker
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
      children,
      disabled,
      hasSpinChecker,
      ...rest
    } = props;

    const theme = useTheme();
    const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
    const [versionsState, versionsDispatch] = useContext(VersionsContext);
    const [spinning, setSpinning] = useState(false);
    const listenerName = 'SPINNER';
    let operationCheckStopper = () => {};

    function endSpinning(result) {
      setSpinning(false);
      setOperationRunning(false);
      onSpinStop(result);
    }

    function myOnSpinStop() {
      removeListener(VERSIONS_HUB_CHANNEL, listenerName);
      operationCheckStopper();
      setTimeout(() => {
        endSpinning();
      }, FETCH_DELAY);
    }


    /**
     * Starts a timer for the overall operation. If it goes
     * off then we force version check.
     */
    function startOperationCheckInterval() {
     // const currentVersion = getMarketVersion(versionsState, marketId);
      operationCheckStopper = startTimerChain(OPERATION_TIMEOUT, 20, () => {
        console.debug('Operation check interval firing');
       /* return getVersions()
          .then((versions) => {
            const { marketVersions } = versions;
            const newMarket = _.isEmpty(marketId);
            // eslint-disable-next-line max-len
            const newVersion = marketVersions.find((version) => version.marketId === marketId || (newMarket && version.version === 1));
            if (newVersion && (newMarket || !_.isEqual(newVersion, currentVersion))) {
              // There should not be any need to stop spinning here
              // - the spinner should clean itself up if conditions are met
              versionsDispatch(refreshVersionsAction(versions));
            }
          })
          .catch((error) => {
            operationCheckStopper();
            endSpinning();
            toastErrorAndThrow(error, 'spinVersionCheckError');
          }); */
      });
    }

    const hubListener = (data) => {
      const { payload: { event, message } } = data;
      switch (event) {
        case MARKET_MESSAGE_EVENT: {
          const { object_id: messageMarketId, version } = message;
          if ((messageMarketId === marketId) || (_.isEmpty(marketId) && version === 1)) {
            myOnSpinStop();
          }
          break;
        }
        default:
          // ignore
          console.debug(`Spin blocker ignoring ${event}`);
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
      Promise.resolve(onClick())
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
                      console.debug('Ending Spinning By Checker');
                      operationCheckStopper();
                      endSpinning(operationResult);
                    } else {
                      setTimeout(spinCheck, SPIN_CHECKER_POLL_DELAY);
                    }
                  })
                  .catch(() => {
                    operationCheckStopper();
                  });
              }
              setTimeout(spinCheck, SPIN_CHECKER_POLL_DELAY);
            }
          }
        })
        .catch((error) => {
          operationCheckStopper();
          myOnSpinStop();
          throw error;
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
        {!spinning && children}
      </Component>
    );
  };
  Spinning.propTypes = {
    onSpinStart: PropTypes.func,
    onSpinStop: PropTypes.func,
    onClick: PropTypes.func,
    // eslint-disable-next-line react/forbid-prop-types
    marketId: PropTypes.string.isRequired,
    disabled: PropTypes.bool,
    // are we giving you a spin checker, so don't wait for messages
    hasSpinChecker: PropTypes.bool,
  };
  Spinning.defaultProps = {
    onSpinStart: () => {
    },
    onSpinStop: () => {
    },
    onClick: () => {
    },
    disabled: false,
    hasSpinChecker: false,
  };
  return Spinning;
}
