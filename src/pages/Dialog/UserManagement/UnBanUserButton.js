import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import SyncIcon from '@material-ui/icons/Sync';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import { unbanUser } from '../../../api/users';
import WarningDialog from '../../../components/Warnings/WarningDialog';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';
import { useLockedDialogStyles } from '../DialogEdit';
import { changeBanStatus } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';

function UnBanUserButton(props){
  const {
    marketId,
    userId,
  } = props;

  const [open, setOpen] = useState(false);
  const lockedDialogClasses = useLockedDialogStyles();
  const [state, dispatch] = useContext(MarketPresencesContext);
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function onSpinStop(result) {
    changeBanStatus(state, dispatch, marketId, userId, false);
  }

  function onProceed() {
    return unbanUser(marketId, userId)
      .then((result) => {
        return {
          result: false,
          spinChecker: () => Promise.resolve(true),
        }
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
        icon={<SyncIcon/>}
        issueWarningId="unbanUserWarning"
        /* slots */
        actions={
          <SpinBlockingButton
            className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionEdit)}
            disableFocusRipple
            marketId={marketId}
            onClick={onProceed}
            onSpinStop={onSpinStop}
          >
            <FormattedMessage id="issueProceed" />
          </SpinBlockingButton>
        }
      />
    </div>

  )
}

UnBanUserButton.propTypes = {
  userId: PropTypes.string.isRequired,
};

export default UnBanUserButton;