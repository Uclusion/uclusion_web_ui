import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl'
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getInCurrentVotingStage,
  getProposedOptionsStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { moveInvestibleBackToOptionPool } from '../../../api/investibles';
import { Dialog } from '../../../components/Dialogs';
import { Button } from '@material-ui/core';
import clsx from 'clsx';
import { useLockedDialogStyles } from '../../Dialog/DialogEdit';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import ExpandableSidebarAction from '../../../components/SidebarActions/ExpandableSidebarAction';

function MoveBackToPoolActionButton(props) {
  const { onClick, investibleId, marketId } = props;
  const intl = useIntl();
  const [open, setOpen] = React.useState(false);
  const [marketStagesState] = useContext(MarketStagesContext);
  const inCurrentVotingStage = getInCurrentVotingStage(marketStagesState, marketId);
  const proposedStage = getProposedOptionsStage(marketStagesState, marketId);

  function moveBack() {
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: inCurrentVotingStage.id,
        stage_id: proposedStage.id,
      },
    };
    return moveInvestibleBackToOptionPool(moveInfo)
      .then(() => onClick());
  }

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  const lockedDialogClasses = useLockedDialogStyles();
  return (
    <div>
      <ExpandableSidebarAction
        icon={<ArrowDownwardIcon />}
        label={intl.formatMessage({ id: 'investibleRemoveFromVotingExplanation' })}
        openLabel={intl.formatMessage({ id: 'investibleBackToOptionPoolLabel' })}
        onClick={handleOpen}
      />
      <RemoveOption
        classes={lockedDialogClasses}
        open={open}
        onClose={handleClose}
        issueWarningId="backToOptionPoolWarning"
        /* slots */
        actions={
          <SpinBlockingButton
            className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionEdit)}
            disableFocusRipple
            marketId={marketId}
            onClick={moveBack}
            onSpinStop={onClick}
          >
            <FormattedMessage id="issueProceed" />
          </SpinBlockingButton>
        }
      />
    </div>
  );
}

function RemoveOption(props) {
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
          <ArrowDownwardIcon className={classes.warningTitleIcon} />
          <FormattedMessage id="warning" />
        </React.Fragment>
      }
    />
  );
}

RemoveOption.propTypes = {
  actions: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  issueWarningId: PropTypes.string.isRequired,
};

MoveBackToPoolActionButton.propTypes = {
  onClick: PropTypes.func,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
};

MoveBackToPoolActionButton.defaultProps = {
  onClick: () => {},
};

export default MoveBackToPoolActionButton;
