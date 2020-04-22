import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import clsx from 'clsx'
import { archiveMarket, changeUserToObserver } from '../../api/markets'
import ArchiveIcon from '@material-ui/icons/Archive'

import SpinningTooltipIconButton from '../../components/SpinBlocking/SpinningTooltipIconButton'
import { changeObserverStatus, getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
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
import WarningDialog from '../../components/Warnings/WarningDialog'

function ChangeToObserverButton(props) {
  const { marketId, onClick } = props;
  const [mpState, mpDispatch] = useContext(MarketPresencesContext);
  const [marketState] = useContext(MarketsContext);
  const [operationRunning] = useContext(OperationInProgressContext);
  const [open, setOpen] = React.useState(false);
  const market = getMarket(marketState, marketId);
  const { market_type: marketType } = market;
  const lockedDialogClasses = useLockedDialogStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(marketPresencesState, marketId);
  const presencesFollowing = presences.filter((presence) => presence.following && !presence.market_banned);
  const isDeactivate = marketType === PLANNING_TYPE && presencesFollowing && presencesFollowing.length < 3;

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function myOnClick() {
    const actionPromise = isDeactivate ? archiveMarket(marketId) : changeUserToObserver(marketId);
    return actionPromise.then(() => {
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
        icon={<ArchiveIcon htmlColor="#bdbdbd" />}
      />
    );
  }

  return (
    <div>
      <TooltipIconButton disabled={operationRunning} icon={<ArchiveIcon htmlColor="#bdbdbd" />} onClick={handleOpen}
                         translationId="decisionDialogsBecomeObserver" />
      <WarningDialog
        classes={lockedDialogClasses}
        open={open}
        onClose={handleClose}
        icon={<ArchiveIcon htmlColor="#bdbdbd" />}
        issueWarningId={isDeactivate ? 'deactivateWarning' : 'archiveWarning'}
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

ChangeToObserverButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  onClick: PropTypes.func,
};

ChangeToObserverButton.defaultProps = {
  onClick: () => {},
};

export default ChangeToObserverButton;
