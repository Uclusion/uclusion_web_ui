import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import SyncIcon from '@material-ui/icons/Sync'
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton'
import { unbanUser } from '../../../api/users'
import WarningDialog from '../../../components/Warnings/WarningDialog'
import { useIntl } from 'react-intl'
import { useLockedDialogStyles } from '../LockedDialog'
import { changeBanStatus } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { Undo } from '@material-ui/icons'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';

function UnBanUserButton(props){
  const {
    marketId,
    userId,
  } = props;
  const intl = useIntl();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [open, setOpen] = useState(false);
  const lockedDialogClasses = useLockedDialogStyles();
  const [state, dispatch] = useContext(MarketPresencesContext);
  const [commentsState] = useContext(CommentsContext);
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function onSpinStop(result) {
    changeBanStatus(state, dispatch, marketId, userId, false, commentsState);
  }

  function onProceed() {
    return unbanUser(marketId, userId)
      .then(() => {
        setOperationRunning(false);
        onSpinStop(false);
      });
  }

  return (
    <div>
    <TooltipIconButton
      translationId="existingUsersUnBanUser"
      icon={<SyncIcon/>}
      onClick={handleOpen}
    />
      <WarningDialog
        classes={lockedDialogClasses}
        open={open}
        onClose={handleClose}
        issueWarningId="unbanUserWarning"
        /* slots */
        actions={
          <SpinningIconLabelButton icon={Undo} onClick={onProceed} id="undoBanUserButton">
            {intl.formatMessage({ id: 'issueProceed' })}
          </SpinningIconLabelButton>
        }
      />
    </div>

  )
}

UnBanUserButton.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UnBanUserButton;