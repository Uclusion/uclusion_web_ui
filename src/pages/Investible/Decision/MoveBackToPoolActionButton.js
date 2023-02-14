import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage } from 'react-intl'
import ArrowDownwardIcon from '@material-ui/icons/ArrowDownward'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import {
  getInCurrentVotingStage,
  getProposedOptionsStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { moveInvestibleBackToOptionPool } from '../../../api/investibles'
import { Dialog } from '../../../components/Dialogs'
import { useLockedDialogStyles } from '../../Dialog/LockedDialog'
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { Clear } from '@material-ui/icons'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import WarningIcon from '@material-ui/icons/Warning'

function MoveBackToPoolActionButton(props) {
  const { onClick, investibleId, marketId } = props;
  const [open, setOpen] = React.useState(false);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
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
      .then((inv) => {
        setOperationRunning(false);
        refreshInvestibles(invDispatch, diffDispatch, [inv]);
        onClick();
      });
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
      <SpinningIconLabelButton icon={ArrowDownwardIcon} doSpin={false}
                               onClick={handleOpen} noMargin>
        <FormattedMessage id="investibleRemoveFromVotingTitle" />
      </SpinningIconLabelButton>
      <RemoveOption
        classes={lockedDialogClasses}
        open={open}
        onClose={handleClose}
        issueWarningId="backToOptionPoolWarning"
        /* slots */
        actions={
          <SpinningIconLabelButton onClick={moveBack} icon={ArrowDownwardIcon} id="moveBackToPoolButton">
            <FormattedMessage id="issueProceed" />
          </SpinningIconLabelButton>
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
          <SpinningIconLabelButton onClick={onClose} icon={Clear} ref={autoFocusRef} doSpin={false}>
            <FormattedMessage id="lockDialogCancel" />
          </SpinningIconLabelButton>
          {actions}
        </React.Fragment>
      }
      content={<FormattedMessage id={issueWarningId} />}
      title={
        <React.Fragment>
          <WarningIcon className={classes.warningTitleIcon} />
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
