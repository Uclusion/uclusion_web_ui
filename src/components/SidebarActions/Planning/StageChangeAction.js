import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage, useIntl } from 'react-intl'
import SpinBlockingListAction from '../../../components/SpinBlocking/SpinBlockingListAction'
import { stageChangeInvestible } from '../../../api/investibles'
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { EMPTY_SPIN_RESULT } from '../../../constants/global'
import { makeStyles } from '@material-ui/styles'
import { Dialog } from '../../Dialogs'
import { Button, ListItemIcon, ListItemText, Tooltip } from '@material-ui/core'
import clsx from 'clsx'
import { useLockedDialogStyles } from '../../../pages/Dialog/DialogBodyEdit'
import { resolveInvestibleComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import TooltipIconButton from '../../Buttons/TooltipIconButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'

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
    menuTitle: {
      paddingLeft: 0,
      paddingRight: 0,
      marginRight: 0,
      color: 'black',
      fontWeight: 'bold',
    },
    menuTitleDisabled: {
      paddingLeft: 0,
      paddingRight: 0,
      marginRight: 0,
      color: 'grey',
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
    operationBlocked,
    blockedOperationTranslationId,
    standAlone
  } = props;
  const classes = useStyles();
  const intl = useIntl();
  const [, invDispatch] = useContext(InvestiblesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const autoFocusRef = React.useRef(null);
  const lockedDialogClasses = useLockedDialogStyles();
  const [open, setOpen] = React.useState(false);
  const [operationRunning] = useContext(OperationInProgressContext);

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
      .then((newInv) => {
        refreshInvestibles(invDispatch, diffDispatch, [newInv]);
        const targetStage = getFullStage(marketStagesState, marketId, targetStageId);
        if (targetStage.close_comments_on_entrance) {
          resolveInvestibleComments(investibleId, marketId, commentsState, commentsDispatch);
        }
        return EMPTY_SPIN_RESULT;
      });
  }

  if (operationBlocked) {
    return (
      <>
        {standAlone && (
          <TooltipIconButton disabled={operationRunning || disabled} icon={icon} onClick={handleOpen}
                             translationId={explanationId} >
            {isOpen && (
              <ListItemText className={classes.menuTitleDisabled}>
                {intl.formatMessage({ id: translationId })}
              </ListItemText>
            )}
          </TooltipIconButton>
        )}
        {!standAlone && (
          <>
            <Tooltip title={intl.formatMessage({ id: explanationId })}>
              <ListItemIcon className={classes.menuIcon} onClick={handleOpen}>
                {icon}
              </ListItemIcon>
            </Tooltip>
            {(isOpen !== undefined ? isOpen : true) && (
              <Tooltip title={intl.formatMessage({ id: explanationId })}>
                <ListItemText className={classes.menuTitleDisabled} onClick={handleOpen}>
                  {intl.formatMessage({ id: translationId })}
                </ListItemText>
              </Tooltip>
            )}
          </>
        )}
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
  operationBlocked: PropTypes.bool,
  blockedOperationTranslationId: PropTypes.string,
  standAlone: PropTypes.bool
};

StageChangeAction.defaultProps = {
  onSpinStop: () => {},
  operationBlocked: false,
  blockedOperationTranslationId: '',
  isOpen: true,
  standAlone: false
};
export default StageChangeAction;
