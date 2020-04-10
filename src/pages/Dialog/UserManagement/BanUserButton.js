import React, { useState } from 'react';
import PropTypes from 'prop-types';
import BlockIcon from '@material-ui/icons/Block';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import WarningDialog from '../../../components/Warnings/WarningDialog';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import clsx from 'clsx';
import { FormattedMessage } from 'react-intl';
import { useLockedDialogStyles } from '../DialogEdit';
import { banUser } from '../../../api/users';

function BanUserButton(props){
  const {
    marketId,
    userId,
  } = props;
  const lockedDialogClasses = useLockedDialogStyles();
  const [open, setOpen] = useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function onProceed() {
    return banUser(marketId, userId);
  }

  return (
    <div>
    <TooltipIconButton
      translationId="existingUsersBanUser"
      icon={<BlockIcon/>}
      onClick={handleOpen}
    />
      <WarningDialog
        classes={lockedDialogClasses}
        open={open}
        onClose={handleClose}
        icon={<BlockIcon/>}
        issueWarningId="banUserWarning"
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

BanUserButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
};

export default BanUserButton;