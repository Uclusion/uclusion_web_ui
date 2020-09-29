import React, { useContext } from 'react'
import UnarchiveIcon from '@material-ui/icons/Unarchive'
import PropTypes from 'prop-types'
import { activateMarket, changeUserToObserver } from '../../../api/markets'
import { changeObserverStatus } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { EMPTY_SPIN_RESULT } from '../../../constants/global'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton'
import { Dialog } from '../../../components/Dialogs'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import clsx from 'clsx'
import { FormattedMessage } from 'react-intl'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import Button from '@material-ui/core/Button'
import { useLockedDialogStyles } from '../DialogEdit'
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'

function ActivateMarketButton(props) {
  const { marketId, isFollowing } = props;
  const [mpState, mpDispatch] = useContext(MarketPresencesContext);
  const [operationRunning] = useContext(OperationInProgressContext);
  const [open, setOpen] = React.useState(false);
  const autoFocusRef = React.useRef(null);
  const lockedDialogClasses = useLockedDialogStyles();
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function myOnClick() {
    activateMarket(marketId).then((market) => {
      addMarketToStorage(marketsDispatch, diffDispatch, market);
      if (!isFollowing) {
        return changeUserToObserver(marketId).then(() => {
          changeObserverStatus(mpState, mpDispatch, marketId, true);
          return EMPTY_SPIN_RESULT;
        });
      }
      return EMPTY_SPIN_RESULT;
    });
  }

  return (
    <>
      <TooltipIconButton disabled={operationRunning} icon={<UnarchiveIcon htmlColor={ACTION_BUTTON_COLOR} />} onClick={handleOpen}
                         translationId="planningMarketActivate" />
      <Dialog
        autoFocusRef={autoFocusRef}
        classes={{
          root: lockedDialogClasses.root,
          actions: lockedDialogClasses.actions,
          content: lockedDialogClasses.issueWarningContent,
          title: lockedDialogClasses.title
        }}
        open={open}
        onClose={handleClose}
        /* slots */
        actions={
          <React.Fragment>
            <Button
              className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionCancel)}
              disableFocusRipple
              onClick={handleClose}
              ref={autoFocusRef}
            >
              <FormattedMessage id="cancel" />
            </Button>
            <SpinBlockingButton
              className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionEdit)}
              disableFocusRipple
              marketId={marketId}
              onClick={myOnClick}
              hasSpinChecker
            >
              <FormattedMessage id="proceedActivate" />
            </SpinBlockingButton>
          </React.Fragment>
        }
        content={<FormattedMessage id="activateDialogQuestion" />}
        title={
          <React.Fragment>
            <UnarchiveIcon htmlColor={ACTION_BUTTON_COLOR} />
            <FormattedMessage id="warningQuestion" />
          </React.Fragment>
        }
      />
    </>
  );
}

ActivateMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  isFollowing: PropTypes.bool.isRequired
};

export default ActivateMarketButton;
