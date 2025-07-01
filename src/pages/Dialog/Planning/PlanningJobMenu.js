import React, { useContext } from 'react';
import { makeStyles, Menu, MenuItem, Tooltip } from '@material-ui/core';
import { useIntl } from 'react-intl';
import { formWizardLink, navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions';
import { stageChangeInvestible, updateInvestible } from '../../../api/investibles';
import {
  getAcceptedStage,
  getFullStage,
  getFurtherWorkStage, getInCurrentVotingStage, getInReviewStage,
  getNotDoingStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { UNASSIGNED_TYPE } from '../../../constants/notifications';
import { JOB_STAGE_WIZARD_TYPE } from '../../../constants/markets';
import { useHistory } from 'react-router';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { getGroupPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';

const useStyles = makeStyles(() => ({
  paperMenu: {
    border: '0.5px solid grey',
  },
}));

function PlanningJobMenu(props) {
  const { anchorEl, recordPositionToggle, marketId, investibleId, stageId, openForInvestment, isBlocked,
    needsAssist, groupId, marketPresences } = props;
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const classes = useStyles();
  const intl = useIntl();
  const history = useHistory();
  const backlogStage = getFurtherWorkStage(marketStagesState, marketId);
  const backlogStageId = backlogStage?.id;
  const notDoingStageId = getNotDoingStage(marketStagesState, marketId)?.id;
  const acceptedStageId = getAcceptedStage(marketStagesState, marketId)?.id;
  const invotingStageId = getInCurrentVotingStage(marketStagesState, marketId)?.id;
  const tasksCompleteStageId = getInReviewStage(marketStagesState, marketId)?.id;
  const groupMembers = getGroupPresences(marketPresences, groupPresencesState, marketId, groupId);
  const myPresence = marketPresences.find((presence) => presence.current_user) || {};
  const isMember = groupMembers.find((member) => member.id === myPresence.id);
  const inAssist = stageId === backlogStageId || isBlocked || needsAssist;

  function stageChange(targetStageId, readyToStart, assignments) {
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
      if (assignments !== undefined) {
        moveInfo.stageInfo.assignments = assignments;
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

  function setReadyToStart(isReadyToStart) {
    const updateInfo = {
      marketId,
      investibleId,
      openForInvestment: isReadyToStart,
    };
    setOperationRunning(`readyToStartCheckbox${investibleId}`);
    return updateInvestible(updateInfo).then((fullInvestible) => {
      onInvestibleStageChange(stageId, fullInvestible, investibleId, marketId, undefined,
        undefined, invDispatch, diffDispatch, marketStagesState, [UNASSIGNED_TYPE],
        backlogStage);
      setOperationRunning(false);
    });
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
        {(stageId !== backlogStageId || !openForInvestment) && !isBlocked && (
          <MenuItem key="backlogReadyToStartKey" id="backlogReadyToStartId"
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      if (stageId === backlogStageId) {
                        return setReadyToStart(true).then(() => recordPositionToggle());
                      }
                      return stageChange(backlogStageId, true).then(() => recordPositionToggle());
                    }}
          >
            <Tooltip placement='top' title={intl.formatMessage({ id: 'assignReadyJobsToolTip' })}>
              <div>
                {intl.formatMessage({ id: 'backlogReadyToStartHeader' })}
              </div>
            </Tooltip>
          </MenuItem>
        )}
        {(stageId !== backlogStageId || openForInvestment) && (
          <MenuItem key="backlogNotReadyToStartKey" id="backlogNotReadyToStartId"
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      if (stageId === backlogStageId) {
                        return setReadyToStart(false).then(() => recordPositionToggle());
                      }
                      return stageChange(backlogStageId, false).then(() => recordPositionToggle());
                    }}
          >
            <Tooltip placement='top' title={intl.formatMessage({ id: 'notReadyToolTip' })}>
              <div>
                {intl.formatMessage({ id: 'backlogNotReadyToStartHeader' })}
              </div>
            </Tooltip>
          </MenuItem>
        )}
        {inAssist && isMember && (
          <MenuItem key="planningInvestibleNextStageAcceptedKey" id="planningInvestibleNextStageAcceptedId"
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      // Must assign to current user as cannot move to accepted for someone else
                      if (isBlocked || needsAssist) {
                        if (stageId === backlogStageId) {
                          return navigate(history,
                            `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, investibleId)}&stageId=${acceptedStageId}&assignId=${myPresence.id}`);
                        }
                        return navigate(history,
                          `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, investibleId)}&stageId=${acceptedStageId}`);
                      }
                      return stageChange(acceptedStageId, undefined, [myPresence.id])
                        .then(() => recordPositionToggle());
                    }}
          >
            <Tooltip placement='top' title={intl.formatMessage({ id: 'JobAssignStart' })}>
              <div>
                {intl.formatMessage({ id: 'planningInvestibleNextStageAcceptedLabel' })}
              </div>
            </Tooltip>
          </MenuItem>
        )}
        {inAssist && (
          <MenuItem key="planningInvestibleToVotingKey" id="planningInvestibleToVotingId"
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      if (isBlocked || needsAssist) {
                        if (stageId === backlogStageId) {
                          return navigate(history,
                            `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, investibleId)}&stageId=${invotingStageId}&isAssign=true`);
                        }
                        return navigate(history,
                          `${formWizardLink(JOB_STAGE_WIZARD_TYPE, marketId, investibleId)}&stageId=${invotingStageId}`);
                      }
                      return stageChange(invotingStageId).then(() => recordPositionToggle());
                    }}
          >
            <Tooltip placement='top' title={intl.formatMessage({ id: 'JobAssignWaiting' })}>
              <div>
                {intl.formatMessage({ id: 'planningInvestibleToVotingLabel' })}
              </div>
            </Tooltip>
          </MenuItem>
        )}
        {stageId === backlogStageId && (
          <MenuItem key="planningInvestibleMoveToVerifiedKey" id="planningInvestibleMoveToVerifiedId"
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      return stageChange(tasksCompleteStageId).then(() => recordPositionToggle());
                    }}
          >
            <Tooltip placement='top' title={intl.formatMessage({ id: 'allDone' })}>
              <div>
                {intl.formatMessage({ id: 'planningInvestibleMoveToVerifiedLabel' })}
              </div>
            </Tooltip>
          </MenuItem>
        )}
        {stageId !== notDoingStageId && (
          <MenuItem key="dialogArchivesNotDoingHeaderKey" id="dialogArchivesNotDoingHeaderId"
                    onClick={(event) => {
                      preventDefaultAndProp(event);
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
