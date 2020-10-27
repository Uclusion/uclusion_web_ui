import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { FormattedMessage, useIntl } from 'react-intl'
import SpinBlockingListAction from '../../../components/SpinBlocking/SpinBlockingListAction'
import { stageChangeInvestible } from '../../../api/investibles'
import { getInvestible, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { EMPTY_SPIN_RESULT } from '../../../constants/global'
import { makeStyles } from '@material-ui/styles'
import { Dialog } from '../../Dialogs'
import { Button, ListItemText } from '@material-ui/core'
import clsx from 'clsx'
import { useLockedDialogStyles } from '../../../pages/Dialog/DialogBodyEdit'
import SpinBlockingButton from '../../SpinBlocking/SpinBlockingButton'
import ArchiveIcon from '@material-ui/icons/Archive'
import TooltipIconButton from '../../Buttons/TooltipIconButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getRequiredInputStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { ACTION_BUTTON_COLOR } from '../../Buttons/ButtonConstants'

export const useStyles = makeStyles(() => {
  return {
    root: {
      alignItems: "flex-start",
      display: "flex"
    },
    menuItem: {
      paddingLeft: 0,
      marginRight: 0,
      paddingBottom: '10px',
    },
    menuIcon: {
      paddingLeft: 0,
      paddingRight: 0,
      marginRight: 0,
      display: 'flex',
      justifyContent: 'center',
      color: 'black',
      '& > .MuiSvgIcon-root': {
        width: '30px',
        height: '30px',
      },
    },
    menuIconHighlighted: {
      paddingLeft: 0,
      paddingRight: 0,
      marginRight: 0,
      display: 'flex',
      justifyContent: 'center',
      boxShadow: "0px 5px 0px yellow",
      color: 'black',
      '& > .MuiSvgIcon-root': {
        width: '30px',
        height: '50px',
      },
    },
    menuTitleHighlighted: {
      paddingLeft: 0,
      paddingRight: 0,
      marginRight: 0,
      marginLeft: 0,
      color: 'black',
      fontWeight: 'bold',
      boxShadow: "5px 5px 5px yellow, 0px 5px 0px yellow"
    },
    menuTitle: {
      paddingLeft: 0,
      paddingRight: 0,
      marginRight: 0,
      color: 'black',
      fontWeight: 'bold',
    },
  };
});

function StageChangeAction(props) {
  const {
    investibleId,
    marketId,
    currentStageId,
    targetStageId,
    icon,
    translationId,
    explanationId,
    onSpinStop,
    isOpen,
    disabled,
    removeAssignments,
    operationBlocked,
    blockedOperationTranslationId,
    highlight,
  } = props;
  const classes = useStyles();
  const intl = useIntl();
  const [invState, invDispatch] = useContext(InvestiblesContext);
  const [operationRunning] = useContext(OperationInProgressContext);
  const [, diffDispatch] = useContext(DiffContext);
  const inv = getInvestible(invState, investibleId) || {};
  const { market_infos: marketInfos } = inv;
  const thisMarketInfo = (marketInfos || []).find((info) => info.market_id === marketId);
  const autoFocusRef = React.useRef(null);
  const lockedDialogClasses = useLockedDialogStyles();
  const [open, setOpen] = React.useState(false);
  const [marketStagesState] = useContext(MarketStagesContext);
  const handleOpen = () => {
    setOpen(true);
  };

  function moveToTarget() {
    setOpen(false);
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: currentStageId,
        stage_id: targetStageId,
      },
    };
    return stageChangeInvestible(moveInfo)
      .then(() => {
        const newInfo = {
          ...thisMarketInfo,
          stage: targetStageId
        };
        if (removeAssignments) {
          delete newInfo.assigned;
        }
        const newMarketInfos = _.unionBy([newInfo], marketInfos, 'id');
        const newInv = {
          ...inv,
          market_infos: newMarketInfos
        };
        // console.log(newInv);
        refreshInvestibles(invDispatch, diffDispatch, [newInv]);
        return EMPTY_SPIN_RESULT;
      });
  }

  if (operationBlocked) {
    return (
      <>
        <TooltipIconButton disabled={operationRunning || disabled} icon={icon} onClick={handleOpen}
                           translationId={explanationId} >
          {isOpen && (
            <ListItemText className={classes.menuTitle}>
              {intl.formatMessage({ id: translationId })}
            </ListItemText>
          )}
        </TooltipIconButton>
        <br />
        <Dialog
          autoFocusRef={autoFocusRef}
          classes={{
            root: lockedDialogClasses.root,
            actions: lockedDialogClasses.actions,
            content: lockedDialogClasses.issueWarningContent,
            title: lockedDialogClasses.title
          }}
          open={open}
          onClose={() => setOpen(false)}
          /* slots */
          actions={
            <Button
              className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionCancel)}
              disableFocusRipple
              onClick={() => setOpen(false)}
              ref={autoFocusRef}
            >
              <FormattedMessage id="lockDialogCancel" />
            </Button>
          }
          content={<FormattedMessage id={blockedOperationTranslationId} />}
          title={
            <React.Fragment>
              <FormattedMessage id="blockedNotice" />
            </React.Fragment>
          }
        />
      </>
    );
  }

  if (currentStageId === (getRequiredInputStage(marketStagesState, marketId) || {}).id) {
    return (
      <>
        <TooltipIconButton disabled={operationRunning || disabled} icon={icon} onClick={handleOpen}
                           translationId={explanationId} >
        {isOpen && (
          <ListItemText className={classes.menuTitle}>
            {intl.formatMessage({ id: translationId })}
          </ListItemText>
        )}
        </TooltipIconButton>
        <br />
        <Dialog
          autoFocusRef={autoFocusRef}
          classes={{
            root: lockedDialogClasses.root,
            actions: lockedDialogClasses.actions,
            content: lockedDialogClasses.issueWarningContent,
            title: lockedDialogClasses.title
          }}
          open={open}
          onClose={() => setOpen(false)}
          /* slots */
          actions={
            <React.Fragment>
              <SpinBlockingButton
                className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionEdit)}
                disableFocusRipple
                marketId={marketId}
                onClick={moveToTarget}
                hasSpinChecker
                onSpinStop={onSpinStop}
              >
                <FormattedMessage id="yesAndProceed" />
              </SpinBlockingButton>
              <Button
                className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionCancel)}
                disableFocusRipple
                onClick={() => setOpen(false)}
                ref={autoFocusRef}
              >
                <FormattedMessage id="lockDialogCancel" />
              </Button>
            </React.Fragment>
          }
          content={<FormattedMessage id="deactivateInlineQuestion" />}
          title={
            <React.Fragment>
              <ArchiveIcon htmlColor={ACTION_BUTTON_COLOR} />
              <FormattedMessage id="warning" />
            </React.Fragment>
          }
        />
      </>
    );
  }

  return (
    <SpinBlockingListAction
      marketId={marketId}
      icon={icon}
      hasSpinChecker
      onSpinStop={onSpinStop}
      label={intl.formatMessage({ id: explanationId })}
      openLabel={intl.formatMessage({ id: translationId })}
      onClick={moveToTarget}
      customClasses={classes}
      isOpen={isOpen}
      disabled={disabled}
      highlight={highlight}
    />
  );
}

StageChangeAction.propTypes = {
  investibleId: PropTypes.string.isRequired,
  onSpinStop: PropTypes.func,
  icon: PropTypes.element.isRequired,
  translationId: PropTypes.string.isRequired,
  explanationId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  currentStageId: PropTypes.string.isRequired,
  targetStageId: PropTypes.string.isRequired,
  isOpen: PropTypes.bool,
  disabled: PropTypes.bool.isRequired,
  removeAssignments: PropTypes.bool,
  operationBlocked: PropTypes.bool,
  blockedOperationTranslationId: PropTypes.string,
};

StageChangeAction.defaultProps = {
  onSpinStop: () => {},
  removeAssignments: false,
  operationBlocked: false,
  blockedOperationTranslationId: '',
  isOpen: true
};
export default StageChangeAction;
