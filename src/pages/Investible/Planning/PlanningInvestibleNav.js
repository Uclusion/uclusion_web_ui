import clsx from 'clsx';
import {
  Checkbox,
  FormControlLabel,
  makeStyles,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton';
import { ExpandLess, SyncAlt, ThumbDown, ThumbUp } from '@material-ui/icons';
import { FormattedMessage, useIntl } from 'react-intl';
import { isEveryoneGroup } from '../../../contexts/GroupMembersContext/groupMembersHelper';
import AttachedFilesList from '../../../components/Files/AttachedFilesList';
import React, { useContext } from 'react';
import { Assignments, rejectInvestible, useCollaborators } from './PlanningInvestible';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { findMessageOfType, findMessageOfTypeAndId } from '../../../utils/messageUtils';
import { getDiff, markDiffViewed } from '../../../contexts/DiffContext/diffContextHelper';
import { getCurrentStageLabelId, getStagesInfo } from '../../../utils/stageUtils';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import PropTypes from 'prop-types';
import {
  attachFilesToInvestible,
  deleteAttachedFilesFromInvestible,
  stageChangeInvestible,
  updateInvestible
} from '../../../api/investibles';
import { onInvestibleStageChange } from '../../../utils/investibleFunctions';
import { UNASSIGNED_TYPE } from '../../../constants/notifications';
import {
  getAcceptedStage,
  getFullStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { addInvestible, refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { formWizardLink, navigate } from '../../../utils/marketIdPathFunctions';
import {
  APPROVAL_WIZARD_TYPE,
  JOB_APPROVERS_WIZARD_TYPE,
  JOB_ASSIGNEE_WIZARD_TYPE,
  JOB_COLLABORATOR_WIZARD_TYPE,
  JOB_STAGE_WIZARD_TYPE
} from '../../../constants/markets';
import { useHistory } from 'react-router';
import InvesibleCommentLinker from '../../Dialog/InvesibleCommentLinker';
import { getGroupPresences, isSingleUserMarket } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { useAddressed } from '../../../utils/votingUtils';
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext';
import { getMidnightToday } from '../../../utils/timerUtils';
import _ from 'lodash';
import { removeMessages } from '../../../contexts/NotificationsContext/notificationsContextReducer';
import { DaysEstimate } from '../../../components/AgilePlan/DaysEstimate';
import { ISSUE_TYPE } from '../../../constants/comments';

const useStyles = makeStyles(
  () => ({
    myCheckbox: {
      '& .MuiSvgIcon-root': {
        scale: '1.4'
      },
    },
  }),
  { name: "PlanningInvestibleNav" }
);
export default function PlanningInvestibleNav(props) {
  const { name, market, marketInvestible, classes, userId, isAssigned,
    pageState, marketPresences, assigned, isInVoting, investibleComments, marketInfo, marketId,
    updatePageState, investibleId } = props;
  const intl = useIntl();
  const history = useHistory();
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const styles = useStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const { stage, required_approvers:  requiredApprovers, open_for_investment: openForInvestment,
    accepted, group_id: groupId, completion_estimate: marketDaysEstimate } = marketInfo;
  const groupPresences = getGroupPresences(marketPresences, groupPresencesState, marketId, groupId) || [];
  const addressed = useAddressed(groupPresences, marketPresences, investibleId, marketId);
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const attachedFiles = marketInvestible.investible && marketInvestible.investible.attached_files;
  const unacceptedAssignment = findMessageOfType('UNREAD_JOB_APPROVAL_REQUEST', investibleId, messagesState);
  const unaccepted = unacceptedAssignment && isAssigned && !accepted?.includes(userId);

  function onDeleteFile(path) {
    return deleteAttachedFilesFromInvestible(market.id, investibleId, [path]).then((investible) => {
      addInvestible(investiblesDispatch, diffDispatch, investible);
      setOperationRunning(false);
    });
  }

  function onAttachFiles(metadatas) {
    return attachFilesToInvestible(market.id, investibleId, metadatas)
      .then((investible) => addInvestible(investiblesDispatch, diffDispatch, investible));
  }

  const stagesInfo = getStagesInfo(market.id, marketStagesState, stage);
  const {
    isInAccepted,
    isFurtherWork
  } = stagesInfo;
  const addressedIds = (addressed || []).filter((address) => !address.abstain)
    .map((address) => address.id);
  const investibleCollaborators = useCollaborators(marketPresences, investibleComments, marketPresencesState,
    investibleId, market.id);
  const assignedNotAccepted = assigned.filter((assignee) => !(accepted || []).includes(assignee));
  const reportMessage = findMessageOfType('REPORT_REQUIRED', investibleId, messagesState);
  const hasBlockingIssue = !_.isEmpty(investibleComments.find((comment) => comment.comment_type === ISSUE_TYPE
    && !comment.resolved))

  function setReadyToStart(isReadyToStart) {
    const updateInfo = {
      marketId,
      investibleId,
      openForInvestment: isReadyToStart,
    };
    setOperationRunning(`readyToStartCheckbox${investibleId}`);
    return updateInvestible(updateInfo).then((fullInvestible) => {
      onInvestibleStageChange(stage, fullInvestible, investibleId, marketId, undefined,
        undefined, investiblesDispatch, diffDispatch, marketStagesState, [UNASSIGNED_TYPE],
        fullStage);
      setOperationRunning(false);
    });
  }

  function myRejectInvestible() {
    return rejectInvestible(market.id, investibleId, marketInvestible, commentsState, commentsDispatch,
      investiblesDispatch, diffDispatch, marketStagesState, marketPresencesDispatch);
  }

  function handleDateChange(rawDate) {
    const date = getMidnightToday(rawDate);
    const daysEstimate = marketDaysEstimate ? new Date(marketDaysEstimate) : undefined;
    if (!_.isEqual(date, daysEstimate)) {
      const updateInfo = {
        marketId,
        investibleId,
        daysEstimate: date,
      };
      setOperationRunning(true);
      return updateInvestible(updateInfo).then((fullInvestible) => {
        refreshInvestibles(investiblesDispatch, diffDispatch, [fullInvestible]);
        if (reportMessage) {
          messagesDispatch(removeMessages([reportMessage.type_object_id]));
        }
        setOperationRunning(false);
      });
    }
  }
  const readyToStartChecked = operationRunning === `readyToStartCheckbox${investibleId}` ?
    !openForInvestment : openForInvestment;
  const isSingleUser = isSingleUserMarket(marketPresences, market);
  const useInVoting = isInVoting && !isSingleUser;

  function assignToSingleUser() {
    const fullMoveStage = getAcceptedStage(marketStagesState, marketId);
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: marketInfo.stage,
        stage_id: fullMoveStage.id,
        assignments: [userId]
      },
    };
    return stageChangeInvestible(moveInfo)
      .then((newInv) => {
        onInvestibleStageChange(fullMoveStage.id, newInv, investibleId, marketId, commentsState,
          commentsDispatch, investiblesDispatch, () => {}, marketStagesState, undefined,
          fullStage, marketPresencesDispatch);
        setOperationRunning(false);
      });
  }

  return (
    <>
      {!mobileLayout && (
        <div style={{ maxWidth: '11rem', width: '100%', wordWrap: 'break-word' }}>
          {name}
        </div>
      )}
      <InvesibleCommentLinker investibleId={investibleId} marketId={marketId} flushLeft />
      {isInAccepted && (
        <DaysEstimate marketId={marketId} onChange={handleDateChange} value={marketDaysEstimate}
                      isAssigned={isAssigned} />
      )}
      {market.id && marketInvestible.investible && (!isSingleUser || !isFurtherWork) && (
        <div className={clsx(classes.group, classes.assignments)}>
          <div className={classes.assignmentContainer}>
            <Assignments
              classes={classes}
              marketPresences={marketPresences}
              assigned={assigned}
              unaccceptedList={useInVoting ? assignedNotAccepted : undefined}
              toggleIconButton={isSingleUser ? (_.isEmpty(assigned) ? assignToSingleUser : undefined) :
                () => navigate(history, formWizardLink(JOB_ASSIGNEE_WIZARD_TYPE, marketId, investibleId))}
              assignmentColumnMessageId='planningInvestibleAssignments'
              toolTipId='storyAddParticipantsLabel'
            />
          </div>
        </div>
      )}
      {unaccepted && (
        <div style={{display: 'flex'}}>
          <SpinningIconLabelButton
            doSpin={false}
            onClick={()=>navigate(history, formWizardLink(APPROVAL_WIZARD_TYPE, marketId, investibleId, groupId))}
            icon={ThumbUp} id='accept' whiteBackground>
            {intl.formatMessage({ id: 'accept' })}
          </SpinningIconLabelButton>
        </div>
      )}
      {unaccepted && (
        <div style={{display: 'flex'}}>
          <SpinningIconLabelButton onClick={myRejectInvestible} icon={ThumbDown} id='reject' whiteBackground>
            {intl.formatMessage({ id: 'reject' })}
          </SpinningIconLabelButton>
        </div>
      )}
      {market.id && marketInvestible.investible && isFurtherWork && (
        <div className={classes.assignmentContainer}>
          {hasBlockingIssue && (
            <Typography variant="body2">
              {intl.formatMessage({ id: 'blockingIssueCheckboxExplanation' })}
            </Typography>
          )}
          {!hasBlockingIssue && (
            <Tooltip key='readyToStartCheckboxKey'
                     title={<FormattedMessage id='readyToStartExplanation' />}>
              <FormControlLabel
                id='readyToStartCheckbox'
                style={{marginLeft: '0.25rem'}}
                control={
                  <Checkbox
                    id={`readyToStartCheckbox${investibleId}`}
                    value={openForInvestment}
                    className={styles.myCheckbox}
                    style={{color: mobileLayout ? 'black' : 'white',
                      backgroundColor: mobileLayout ? (readyToStartChecked ? 'white' : 'lightgrey') :
                        (readyToStartChecked ? 'black' : 'white'),
                      padding: 0, borderRadius: 0}}
                    disabled={operationRunning !== false}
                    checked={readyToStartChecked}
                    onClick={() => setReadyToStart(!openForInvestment)}
                  />
                }
                label={<Typography variant="body2" style={{marginLeft: '0.8rem'}}>
                  {intl.formatMessage({ id: 'readyToStartCheckboxExplanation' })}</Typography>}
              />
            </Tooltip>
          )}
        </div>
      )}
      {!isSingleUser && (
        <div className={clsx(classes.group, classes.assignments)}>
          <div className={classes.assignmentContainer}>
            <Tooltip
              title={intl.formatMessage({ id: 'collaboratorsExplanation' })}>
              <b><FormattedMessage id="collaborators"/></b>
            </Tooltip>
            <Assignments
              classes={classes}
              marketPresences={marketPresences}
              assigned={investibleCollaborators}
              toolTipId="collaborators"
            />
          </div>
        </div>
      )}
      {market.id && marketInvestible.investible && useInVoting && (
        <div className={clsx(classes.group, classes.assignments)}>
          <div className={classes.assignmentContainer}>
            <Assignments
              classes={classes}
              marketPresences={marketPresences}
              assigned={requiredApprovers}
              toolTipId="storyApproversLabel"
              toggleIconButton={() => navigate(history,
                formWizardLink(JOB_APPROVERS_WIZARD_TYPE, marketId, investibleId))}
              assignmentColumnMessageId='requiredApprovers'
            />
          </div>
        </div>
      )}
      {!isEveryoneGroup(groupId, marketId) && (
        <div className={clsx(classes.group, classes.assignments)}>
          <div className={classes.assignmentContainer}>
            <Assignments
              classes={classes}
              marketPresences={marketPresences}
              assigned={addressedIds}
              toolTipId='storyAddressedLabel'
              toggleIconButton={() => navigate(history,
                formWizardLink(JOB_COLLABORATOR_WIZARD_TYPE, marketId, investibleId))}
              assignmentColumnMessageId='addressed'
            />
          </div>
        </div>
      )}
      <MarketMetaData
        stagesInfo={stagesInfo}
        investibleId={investibleId}
        market={market}
        pageState={pageState}
        updatePageState={updatePageState}
      />
      <AttachedFilesList
        marketId={market.id}
        onUpload={onAttachFiles}
        onDeleteClick={onDeleteFile}
        attachedFiles={attachedFiles}
      />
    </>
  );
}

export const useMetaDataStyles = makeStyles(
  theme => {
    return {
      root: {
        alignItems: "flex-start",
        display: "flex",
        flexDirection: 'column',
        width: '100%',
        '& > div': {
          borderRadius: '6px',
          marginBottom: '1rem'
        }
      },
      flexRow: {
        flexDirection: 'row'
      },
      archivedColor: {
        color: '#ffC000',
      },
      normalColor: {
      },
      archived: {
        color: '#ffC000',
        fontSize: 12,
      },
      highlighted: {
        color: 'red',
        fontSize: 12,
      },
      normal: {
        fontSize: 14,
        wordBreak: 'break-word',
      },
      group: {
        backgroundColor: '#ecf0f1',
        borderRadius: 6,
        display: "flex",
        flexDirection: "row",
        padding: theme.spacing(1, 1),
        "&:first-child": {
          marginLeft: 0
        },
        [theme.breakpoints.down("sm")]: {
          backgroundColor: '#fff',
        }
      },
      expiration: {
        "& dd": {
          alignItems: "center",
          display: "flex",
          flex: "1 auto",
          flexDirection: "row",
          fontWeight: "bold",
          [theme.breakpoints.down('sm')]: {
            margin: 0,
          },

        }
      },
      blue: {
        backgroundColor: '#2d9cdb',
      },
      expansionControl: {
        backgroundColor: '#ecf0f1',
        width: '100%'
      },
      fontControl: {
        alignItems: "center",
        textTransform: 'capitalize',
        marginRight: 'auto',
        marginLeft: '5px',
        fontWeight: 700
      },
      expirationProgress: {
        marginRight: theme.spacing(1)
      },
      assignments: {
        padding: 0,
        "& ul": {
          flex: 4,
          margin: 0,
          padding: 0
        },
        "& li": {
          display: "inline-flex",
          fontWeight: "bold",
          marginLeft: theme.spacing(1)
        }
      },
      assignmentContainer: {
        width: '100%',
        textTransform: 'capitalize'
      },
      assignIconContainer: {
        display: 'flex',
        justifyContent: 'center'
      },
      assignmentFlexRow: {
        width: '100%',
        display: 'flex',
        padding: '8px'
      },
      flex1: {
        flex: 1
      },
      noPad: {
        padding: 0
      },
      menuButton: {
        width: '100%',
        padding: '12px'
      },
      linkContainer: {
        width: '100%',
        display: 'flex',
        flexDirection: 'column'
      },
      scrollContainer: {
        maxHeight: '210px',
        overflow: 'auto',
      },
      outerBorder: {
        border: '1px solid black',
        borderRadius: '6px 6px 0 0'
      },
      actionPrimary: {
        backgroundColor: '#2D9CDB',
        color: 'white',
        textTransform: 'unset',
        marginRight: '20px',
        '&:hover': {
          backgroundColor: '#e0e0e0'
        },
        '&:disabled': {
          color: 'white',
          backgroundColor: 'rgba(45, 156, 219, .6)'
        }
      },
      actionSecondary: {
        backgroundColor: '#e0e0e0',
        textTransform: 'unset',
        '&:hover': {
          backgroundColor: "#F1F1F1"
        }
      },
    }
  },
  { name: "MetaData" }
);

function MarketMetaData(props) {
  const {
    market,
    investibleId,
    stagesInfo,
    pageState,
    updatePageState
  } = props;
  const intl = useIntl()
  const {
    showDiff
  } = pageState
  const history = useHistory();
  const [diffState, diffDispatch] = useContext(DiffContext);
  const [messagesState] = useContext(NotificationsContext);
  const myMessageDescription = findMessageOfTypeAndId(investibleId, messagesState, 'DESCRIPTION');
  const diff = getDiff(diffState, investibleId);
  const stageLabelId = getCurrentStageLabelId(stagesInfo);

  function toggleDiffShow() {
    if (showDiff) {
      markDiffViewed(diffDispatch, investibleId);
    }
    updatePageState({showDiff: !showDiff});
  }
  const stageLink = formWizardLink(JOB_STAGE_WIZARD_TYPE, market.id, investibleId);
  return (
    <div>
      <div style={{maxWidth: '15rem', marginRight: '1rem'}}>
        <div style={{marginBottom: '0.5rem', display: 'flex', flexDirection: 'row'}}>
          <b><FormattedMessage id={'allowedStagesDropdownLabel'}/></b>
            <SpinningIconLabelButton
              icon={SyncAlt}
              iconOnly
              id="stageButton"
              doSpin={false}
              whiteBackground
              style={{marginLeft: '1rem', padding: 0, marginBottom: 0, marginTop: '-0.25rem'}}
              onClick={() => navigate(history,
                stagesInfo.isInBlocked ? `${stageLink}&isBlocked=true` : stageLink)}
            />
        </div>
          {intl.formatMessage({id: stageLabelId})}
      </div>
      {myMessageDescription && diff && (
        <>
          <div style={{paddingTop: '0.5rem'}} />
          <SpinningIconLabelButton icon={showDiff ? ExpandLess : ExpandMoreIcon}
                                   onClick={toggleDiffShow} doSpin={false}>
            <FormattedMessage id={showDiff ? 'diffDisplayDismissLabel' : 'diffDisplayShowLabel'} />
          </SpinningIconLabelButton>
        </>
      )}
    </div>
  );
}

MarketMetaData.propTypes = {
  investibleId: PropTypes.string.isRequired,
  market: PropTypes.object.isRequired,
}