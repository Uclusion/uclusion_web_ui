import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { changeUserToObserver } from '../../api/markets'
import { Dialog } from '../../components/Dialogs'
import ArchiveIcon from '@material-ui/icons/Archive'
import { Button } from '@material-ui/core'
import SpinningTooltipIconButton from '../../components/SpinBlocking/SpinningTooltipIconButton'
import { changeObserverStatus } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { EMPTY_SPIN_RESULT } from '../../constants/global'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { PLANNING_TYPE } from '../../constants/markets'
import { useLockedDialogStyles } from './DialogEdit'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import TooltipIconButton from '../../components/Buttons/TooltipIconButton'
import { FormattedMessage } from 'react-intl'
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'

function ChangeToObserverButton(props) {
  const { marketId, onClick } = props;
  const [mpState, mpDispatch] = useContext(MarketPresencesContext);
  const [marketState] = useContext(MarketsContext);
  const [operationRunning] = useContext(OperationInProgressContext);
  const [open, setOpen] = React.useState(false);
  const market = getMarket(marketState, marketId);
  const { market_type: marketType } = market;
  const lockedDialogClasses = useLockedDialogStyles();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function myOnClick() {
    return changeUserToObserver(marketId)
      .then(() => {
        changeObserverStatus(mpState, mpDispatch, marketId, true);
        return EMPTY_SPIN_RESULT;
      });
  }
  if (marketType !== PLANNING_TYPE) {
    return (
      <SpinningTooltipIconButton
        marketId={marketId}
        onClick={myOnClick}
        onSpinStop={onClick}
        key="subscribe"
        translationId="decisionDialogsBecomeObserver"
        icon={<ArchiveIcon/>}
      />
    );
  }

  return (
    <div>
      <TooltipIconButton disabled={operationRunning} icon={<ArchiveIcon />} onClick={handleOpen}
                         translationId="decisionDialogsBecomeObserver" />
      <ArchiveDialog
        classes={lockedDialogClasses}
        open={open}
        onClose={handleClose}
        issueWarningId="archiveWarning"
        /* slots */
        actions={
          <SpinBlockingButton
            className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionEdit)}
            disableFocusRipple
            marketId={marketId}
            onClick={myOnClick}
            hasSpinChecker
            onSpinStop={onClick}
          >
            <FormattedMessage id="issueProceed" />
          </SpinBlockingButton>
        }
      />
    </div>
  );
}

function ArchiveDialog(props) {
  const { actions, classes, open, onClose, issueWarningId } = props;

  const autoFocusRef = React.useRef(null);

  return (
    <Dialog
      autoFocusRef={autoFocusRef}
      classes={{
        root: classes.root,
        actions: classes.actions,
        content: classes.issueWarningContent,
        title: classes.title
      }}
      open={open}
      onClose={onClose}
      /* slots */
      actions={
        <React.Fragment>
          {actions}
          <Button
            className={clsx(classes.action, classes.actionCancel)}
            disableFocusRipple
            onClick={onClose}
            ref={autoFocusRef}
          >
            <FormattedMessage id="lockDialogCancel" />
          </Button>
        </React.Fragment>
      }
      content={<FormattedMessage id={issueWarningId} />}
      title={
        <React.Fragment>
          <ArchiveIcon className={classes.warningTitleIcon} />
          <FormattedMessage id="warning" />
        </React.Fragment>
      }
    />
  );
}

ArchiveDialog.propTypes = {
  actions: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  issueWarningId: PropTypes.string.isRequired,
};

ChangeToObserverButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ChangeToObserverButton.defaultProps = {
  onClick: () => {},
};

export default ChangeToObserverButton;
