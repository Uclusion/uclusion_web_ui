import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { archiveMarket, changeUserToObserver } from '../../api/markets'
import ArchiveIcon from '@material-ui/icons/Archive'
import { changeObserverStatus, getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { addMarketToStorage, getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { PLANNING_TYPE } from '../../constants/markets'
import { useLockedDialogStyles } from './DialogBodyEdit'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import TooltipIconButton from '../../components/Buttons/TooltipIconButton'
import { FormattedMessage } from 'react-intl'
import WarningDialog from '../../components/Warnings/WarningDialog'
import { ACTION_BUTTON_COLOR } from '../../components/Buttons/ButtonConstants'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton'
import { NotificationsOff } from '@material-ui/icons'

function ChangeToObserverButton(props) {
  const { marketId } = props;
  const [mpState, mpDispatch] = useContext(MarketPresencesContext);
  const [marketState, marketsDispatch] = useContext(MarketsContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [open, setOpen] = React.useState(false);
  const market = getMarket(marketState, marketId) || {};
  const { market_type: marketType } = market;
  const lockedDialogClasses = useLockedDialogStyles();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(marketPresencesState, marketId) || [];
  const myPresence = presences.find((presence) => presence.current_user);
  const [, diffDispatch] = useContext(DiffContext);

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function myOnClickChooseDeactivate() {
    return myOnClick(true);
  }

  function myOnClickChooseNotDeactivate() {
    return myOnClick(false);
  }

  function myOnClick(myIsDeactivate) {
    const actionPromise = myIsDeactivate ? archiveMarket(marketId, marketType) : changeUserToObserver(marketId);
    return actionPromise.then((response) => {
        if (myIsDeactivate) {
          addMarketToStorage(marketsDispatch, diffDispatch, response);
        } else {
          changeObserverStatus(mpState, mpDispatch, marketId, true);
        }
        setOperationRunning(false);
      });
  }

  if (marketType !== PLANNING_TYPE) {
    if (myPresence && myPresence.is_admin) {
      return (
        <>
          <TooltipIconButton disabled={operationRunning} icon={<ArchiveIcon htmlColor={ACTION_BUTTON_COLOR} />}
                             onClick={handleOpen} translationId="decisionDialogsBecomeObserver" />
          <WarningDialog
            classes={lockedDialogClasses}
            open={open}
            onClose={handleClose}
            issueWarningId="deactivateDialogQuestion"
            /* slots */
            actions={
              <React.Fragment>
                <SpinningIconLabelButton icon={NotificationsOff} onClick={myOnClickChooseNotDeactivate}
                                         id="noAndProceedDeactivateButton">
                  <FormattedMessage id="noAndProceedDeactivate" />
                </SpinningIconLabelButton>
                <SpinningIconLabelButton icon={ArchiveIcon} onClick={myOnClickChooseDeactivate} noMargin
                                         id="yesAndProceedDeactiveButton">
                  <FormattedMessage id="yesAndProceedDeactive" />
                </SpinningIconLabelButton>
              </React.Fragment>
            }
          />
        </>
      );
    }
    return (
      <SpinningIconLabelButton icon={NotificationsOff} onClick={myOnClickChooseNotDeactivate}
                               id="decisionDialogsBecomeObserverButton">
        <FormattedMessage id="decisionDialogsBecomeObserver" />
      </SpinningIconLabelButton>
    );
  }

  return (
    <>
      <TooltipIconButton disabled={operationRunning} icon={<ArchiveIcon htmlColor={ACTION_BUTTON_COLOR} />}
                         onClick={handleOpen} translationId="decisionDialogsBecomeObserver" />
      <WarningDialog
        classes={lockedDialogClasses}
        open={open}
        onClose={handleClose}
        issueWarningId="archiveWarning"
        /* slots */
        actions={
          <React.Fragment>
            <SpinningIconLabelButton icon={NotificationsOff} onClick={myOnClickChooseNotDeactivate}
                                     id="noAndProceedDeactivateButton">
              <FormattedMessage id="noAndProceedDeactivate" />
            </SpinningIconLabelButton>
            <SpinningIconLabelButton icon={ArchiveIcon} onClick={myOnClickChooseDeactivate} noMargin
                                     id="yesAndProceedDeactiveButton">
              <FormattedMessage id="yesAndProceedDeactive" />
            </SpinningIconLabelButton>
          </React.Fragment>
        }
      />
    </>
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
