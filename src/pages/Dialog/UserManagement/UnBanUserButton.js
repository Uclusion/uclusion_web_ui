import React, {useState} from 'react';
import PropTypes from 'prop-types';
import SyncIcon from '@material-ui/icons/Sync';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import { unbanUser } from '../../../api/users';
import WarningDialog from '../../../components/Warnings/WarningDialog';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';
import { useLockedDialogStyles } from '../DialogEdit';

function UnBanUserButton(props){
  const {
    marketId,
    userId,
  } = props;

  const [open, setOpen] = useState(false);
  const lockedDialogClasses = useLockedDialogStyles();

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function onProceed() {
    return unbanUser(marketId, userId);
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