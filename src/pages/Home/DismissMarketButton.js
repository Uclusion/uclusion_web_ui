import React, { useContext } from 'react';
import { FormattedMessage } from 'react-intl'
import PropTypes from 'prop-types';
import DismissIcon from '@material-ui/icons/RemoveCircle';
import { archiveMarket } from '../../api/markets';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { navigate } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'
import clsx from 'clsx';
import { useLockedDialogStyles } from '../Dialog/DialogEdit';
import { Dialog } from '../../components/Dialogs';
import { Button } from '@material-ui/core';
import { addMarketToStorage } from '../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { EMPTY_SPIN_RESULT } from '../../constants/global';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';

function DismissMarketButton(props) {
  const [operationRunning] = useContext(OperationInProgressContext);
  const [, marketDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const {
    marketId,
  } = props;
  const history = useHistory();
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function myOnClick() {
    return archiveMarket(marketId)
      .then((market) => {
        addMarketToStorage(marketDispatch, diffDispatch, market);
        return EMPTY_SPIN_RESULT;
      });
  }

  const lockedDialogClasses = useLockedDialogStyles();
  return (
    <div>
      <TooltipIconButton disabled={operationRunning} icon={<DismissIcon />} onClick={handleOpen} translationId="decisionDialogsArchiveDialog" />
      <DismissDialog
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
            onSpinStop={() => navigate(history, '/')}
          >
            <FormattedMessage id="issueProceed" />
          </SpinBlockingButton>
        }
      />
    </div>
  );
}

function DismissDialog(props) {
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
          <DismissIcon className={classes.warningTitleIcon} />
          <FormattedMessage id="warning" />
        </React.Fragment>
      }
    />
  );
}

DismissDialog.propTypes = {
  actions: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  issueWarningId: PropTypes.string.isRequired,
};

DismissMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
};

export default DismissMarketButton;
