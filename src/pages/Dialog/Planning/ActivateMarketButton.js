import React, { useContext } from 'react'
import UnarchiveIcon from '@material-ui/icons/Unarchive'
import PropTypes from 'prop-types'
import { activateMarket, changeUserToParticipant } from '../../../api/markets'
import { changeObserverStatus } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton'
import { Dialog } from '../../../components/Dialogs'
import { FormattedMessage } from 'react-intl'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useLockedDialogStyles } from '../DialogBodyEdit'
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { Clear } from '@material-ui/icons'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'

function ActivateMarketButton (props) {
  const { marketId, isFollowing } = props
  const [mpState, mpDispatch] = useContext(MarketPresencesContext)
  const [operationRunning] = useContext(OperationInProgressContext)
  const [open, setOpen] = React.useState(false)
  const autoFocusRef = React.useRef(null)
  const lockedDialogClasses = useLockedDialogStyles()
  const [, marketsDispatch] = useContext(MarketsContext)
  const [, diffDispatch] = useContext(DiffContext)
  const [, setOperationRunning] = useContext(OperationInProgressContext)

  const handleOpen = () => {
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
  };

  function myOnClick() {
    setOpen(false)
    return activateMarket(marketId).then((market) => {
      addMarketToStorage(marketsDispatch, diffDispatch, market)
      if (!isFollowing) {
        return changeUserToParticipant(marketId).then(() => {
          setOperationRunning(false)
          changeObserverStatus(mpState, mpDispatch, marketId, false)
        })
      } else {
        setOperationRunning(false)
      }
    })
  }

  return (
    <>
      <TooltipIconButton disabled={operationRunning !== false} icon={<UnarchiveIcon htmlColor={ACTION_BUTTON_COLOR} />}
                         onClick={handleOpen} translationId="planningMarketActivate" />
      <Dialog
        autoFocusRef={autoFocusRef}
        classes={{
          root: lockedDialogClasses.root,
          actions: lockedDialogClasses.actions,
          content: lockedDialogClasses.issueWarningContent,
          title: lockedDialogClasses.title
        }}
        open={open}
        onClose={handleClose}
        /* slots */
        actions={
          <React.Fragment>
            <SpinningIconLabelButton onClick={handleClose} doSpin={false} icon={Clear} ref={autoFocusRef}>
              <FormattedMessage id="cancel"/>
            </SpinningIconLabelButton>
            <SpinningIconLabelButton onClick={myOnClick} icon={UnarchiveIcon} ref={autoFocusRef}
                                     id="unarchiveWorkspace">
              <FormattedMessage id="proceedActivate"/>
            </SpinningIconLabelButton>
          </React.Fragment>
        }
        content={<FormattedMessage id="activateDialogQuestion"/>}
        title={<FormattedMessage id="warning"/>}
      />
    </>
  );
}

ActivateMarketButton.propTypes = {
  marketId: PropTypes.string.isRequired,
  isFollowing: PropTypes.bool.isRequired
};

export default ActivateMarketButton;
