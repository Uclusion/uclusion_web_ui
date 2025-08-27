import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import BlockIcon from '@material-ui/icons/Block';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';
import WarningDialog from '../../../components/Warnings/WarningDialog';
import { useIntl } from 'react-intl';
import { useLockedDialogStyles } from '../LockedDialog';
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { activateInactiveMarket } from '../../../api/markets';
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper';

function ArchiveMarketButton(props){
  const { marketId } = props;
  const intl = useIntl();
  const lockedDialogClasses = useLockedDialogStyles();
  const [open, setOpen] = useState(false);
  const [, dispatch] = useContext(MarketsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function onProceed() {
    return activateInactiveMarket(marketId, false).then((result) => {
      setOperationRunning(false);
      addMarketToStorage(dispatch, result);
    });
  }

  return (
    <>
    <TooltipIconButton
      translationId="archiveWorkspace"
      icon={<BlockIcon/>}
      onClick={handleOpen}
    />
      <WarningDialog
        classes={lockedDialogClasses}
        open={open}
        onClose={handleClose}
        issueWarningId="archiveMarketWarning"
        /* slots */
        actions={
          <SpinningIconLabelButton icon={BlockIcon} onClick={onProceed} id="archiveWorkspaceProceedButton">
            {intl.formatMessage({ id: 'issueProceed' })}
          </SpinningIconLabelButton>
        }
      />
  </>

  )
}

ArchiveMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
};

export default ArchiveMarketButton;