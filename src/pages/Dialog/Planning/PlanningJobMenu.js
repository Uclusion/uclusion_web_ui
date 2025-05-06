import React, { useContext } from 'react';
import { makeStyles, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { preventDefaultAndProp } from '../../../utils/marketIdPathFunctions';
import { stageChangeInvestible } from '../../../api/investibles';
import {
  getFullStage,
  getFurtherWorkStage,
  getNotDoingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';

const useStyles = makeStyles(() => ({
  paperMenu: {
    border: '0.5px solid grey',
  },
}));

function PlanningJobMenu(props) {
  const { anchorEl, recordPositionToggle, marketId, investibleId, stageId } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const classes = useStyles();
  const intl = useIntl();
  const backlogStageId = getFurtherWorkStage(marketStagesState, marketId)?.id;
  const notDoingStageId = getNotDoingStage(marketStagesState, marketId)?.id;

  function stageChange(targetStageId, readyToStart) {
    if (!operationRunning) {
      const moveInfo = {
        marketId,
        investibleId,
        stageInfo: {
          current_stage_id: stageId,
          stage_id: targetStageId,
        },
      };
      if (readyToStart !== undefined) {
        moveInfo.stageInfo.open_for_investment = readyToStart;
      }
      setOperationRunning(true);
      return stageChangeInvestible(moveInfo)
        .then((inv) => {
          const fullStage = getFullStage(marketStagesState, marketId, stageId) || {};
          onInvestibleStageChange(targetStageId, inv, investibleId, marketId, commentsState, commentsDispatch,
            invDispatch, diffDispatch, marketStagesState, undefined, fullStage, marketPresencesDispatch);
        }).finally(() => {
          setOperationRunning(false);
        });
    }
  }

  return (
      <Menu
        id="job-menu"
        open
        onClose={recordPositionToggle}
        getContentAnchorEl={null}
        anchorOrigin={{
          vertical: 'center',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
        anchorEl={anchorEl}
        disableRestoreFocus
        classes={{ paper: classes.paperMenu }}
        style={{padding: '1rem'}}
      >
        <MenuItem key="backlogReadyToStartKey" id="backlogReadyToStartId"
                  onClick={(event) => {
                    preventDefaultAndProp(event);
                    return stageChange(backlogStageId, true).then(() => recordPositionToggle());
                  }}
        >
          <Tooltip placement='top' title={intl.formatMessage({ id: 'readyToStartToolTip' })}>
            <div>
              {intl.formatMessage({ id: 'backlogReadyToStartHeader' })}
            </div>
          </Tooltip>
        </MenuItem>
        <MenuItem key="backlogNotReadyToStartKey" id="backlogNotReadyToStartId"
                  onClick={(event) => {
                    preventDefaultAndProp(event);
                    recordPositionToggle();
                    return stageChange(backlogStageId, false).then(() => recordPositionToggle());
                  }}
        >
          <Tooltip placement='top' title={intl.formatMessage({ id: 'notReadyToolTip' })}>
            <div>
              {intl.formatMessage({ id: 'backlogNotReadyToStartHeader' })}
            </div>
          </Tooltip>
        </MenuItem>
        {stageId !== notDoingStageId && (
          <MenuItem key="dialogArchivesNotDoingHeaderKey" id="dialogArchivesNotDoingHeaderId"
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      recordPositionToggle();
                      return stageChange(notDoingStageId).then(() => recordPositionToggle());
                    }}
          >
            <Tooltip placement='top' title={intl.formatMessage({ id: 'planningInvestibleNotDoingExplanation' })}>
              <div>
                {intl.formatMessage({ id: 'dialogArchivesNotDoingHeader' })}
              </div>
            </Tooltip>
          </MenuItem>
        )}
      </Menu>
  );
}

export default PlanningJobMenu;
