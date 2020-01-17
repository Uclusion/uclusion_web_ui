import React, { useContext } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import ArchiveIcon from '@material-ui/icons/Archive';
import { makeStyles } from '@material-ui/core/styles';
import Modal from '@material-ui/core/Modal';
import { archiveMarket } from '../../api/markets';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import { withSpinLock } from '../../components/SpinBlocking/SpinBlockingHOC';

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    position: 'absolute',
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
}));

function ArchiveMarketButton(props) {
  const intl = useIntl();
  const [operationRunning] = useContext(OperationInProgressContext);
  const {
    marketId,
    onClick,
  } = props;
  const classes = useStyles();
  const [open, setOpen] = React.useState(false);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };


  function myOnClick() {
    return archiveMarket(marketId);
  }

  const SpinningTooltipIconButton = withSpinLock(TooltipIconButton);

  return (
    <div>
      <TooltipIconButton icon={<ArchiveIcon />} onClick={handleOpen} translationId="decisionDialogsArchiveDialog" />
      <Modal
        aria-labelledby="simple-modal-title"
        aria-describedby="simple-modal-description"
        open={open}
        className={classes.modal}
        onClose={handleClose}
      >
        <div className={classes.paper}>
          <h2 id="simple-modal-title">Warning</h2>
          <p id="simple-modal-description">
            {intl.formatMessage({ id: 'archiveWarning' })}
          </p>
          <SpinningTooltipIconButton
            marketId={marketId}
            onClick={myOnClick}
            onSpinStop={onClick}
            disabled={operationRunning}
            translationId="decisionDialogsArchiveDialog"
            icon={<ArchiveIcon />}
          />
        </div>
      </Modal>
    </div>
  );
}

ArchiveMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ArchiveMarketButton.defaultProps = {
  onClick: () => {
  },
};

export default ArchiveMarketButton;
