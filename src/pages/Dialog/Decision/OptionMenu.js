import React, { useContext } from 'react';
import { IconButton, ListItemIcon, ListItemText, makeStyles, Menu, MenuItem, Tooltip, useTheme } from '@material-ui/core';
import ListAltIcon from '@material-ui/icons/ListAlt';
import QuestionIcon from '@material-ui/icons/ContactSupport';
import { Block } from '@material-ui/icons';
import AssignmentIcon from '@material-ui/icons/Assignment';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown'
import { useIntl } from 'react-intl';
import { navigate, preventDefaultAndProp, formInvestibleAddCommentLink, decomposeMarketPath, formWizardLink } from '../../../utils/marketIdPathFunctions';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { useHistory, useLocation } from 'react-router';
import { APPROVAL_WIZARD_TYPE, DECISION_COMMENT_WIZARD_TYPE, JOB_COMMENT_WIZARD_TYPE } from '../../../constants/markets';
import { ArrowDownward, ArrowUpward } from '@material-ui/icons';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getInCurrentVotingStage, getProposedOptionsStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../../constants/comments';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { moveInvestibleToCurrentVoting } from '../../../api/investibles';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import LightbulbOutlined from '../../../components/CustomChip/LightbulbOutlined';
import { ISSUE_TYPE } from '../../../constants/notifications';
import { useButtonColors } from '../../../components/Buttons/ButtonConstants';

// Type colors for the "add a typed comment" toolbar icons (C-all-992 / Q-all-137,
// option O-1) - the same red/orange/blue/green vocabulary as CommentTypeChip and
// the assistance badges, so each button shows what it adds. The structural icons
// (promote/demote arrows, make-task, vote) keep the neutral actionButtonColor.
const TYPE_ICON_COLORS = {
  task:     { light: '#2E7D32', dark: '#7db05a' },
  issue:    { light: '#C8362F', dark: '#ef8b8b' },
  suggest:  { light: '#B96F00', dark: '#f3ad4d' },
  question: { light: '#2F80ED', dark: '#7db4f7' },
  // Vote/approve isn't a comment type - give it its own purple identity.
  vote:     { light: '#7C3AED', dark: '#B794F6' },
};

const useStyles = makeStyles(() => ({
  paperMenu: {
    border: '0.5px solid grey',
    backgroundColor: 'white'
  },
  listSubHeaderRoot: {
    lineHeight: '30px',
  }
}));

function OptionMenu(props) {
  // B-all-485: when the question is resolved its inline market is inactive, so stage moves,
  // voting, and new comments are gone - making a task on the parent job is the one action left.
  const { anchorEl, recordPositionToggle, marketId, investibleId, openForInvestment, mouseX, mouseY, isAdmin,
    marketPresences, questionResolved } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketsState] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const classes = useStyles();
  const intl = useIntl();
  const history = useHistory();
  const theme = useTheme();
  const isDark = theme.palette.type === 'dark';
  const tColor = (key) => isDark ? TYPE_ICON_COLORS[key].dark : TYPE_ICON_COLORS[key].light;
  const { actionButtonColor } = useButtonColors();
  const location = useLocation();
  const proposedStage = getProposedOptionsStage(marketStagesState, marketId);
  const underConsiderationStage = getInCurrentVotingStage(marketStagesState, marketId);
  const { pathname } = location;
  const { marketId: typeObjectIdRaw, action } = decomposeMarketPath(pathname);
  const typeObjectId = action === 'inbox' ? typeObjectIdRaw : undefined;
  const yourPresence = marketPresences.find((presence) => presence.current_user) || {};
  const yourVote = yourPresence.investments?.find((investment) => investment.investible_id === investibleId
    && !investment.deleted);
  const market = getMarket(marketsState, marketId) || {};
  const { parent_comment_id: parentCommentId, parent_comment_market_id: parentMarketId } = market;
  const comment = getComment(commentsState, parentMarketId, parentCommentId) || {};
  const { investible_id: parentInvestibleId } = comment;

  function createTask() {
    return navigate(history, formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, parentInvestibleId, parentMarketId, 
      TODO_TYPE, undefined, investibleId, marketId));
  }

  function changeStage() {
    const fromStage = openForInvestment ? underConsiderationStage : proposedStage;
    const toStage = openForInvestment ? proposedStage : underConsiderationStage;
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: fromStage.id,
        stage_id: toStage.id,
      },
    };
    setOperationRunning(true);
    return moveInvestibleToCurrentVoting(moveInfo)
      .then((inv) => {
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        setOperationRunning(false);
      });
  }

  // TODO need IDs on all iconbuttons

  if (!anchorEl) {
    return (
      <>
        {!openForInvestment && isAdmin && !questionResolved && (
          <div onClick={(event) => {
            preventDefaultAndProp(event);
            return changeStage();
          }}>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'promoteOption' })}>
              <IconButton size="small" id="promoteOptionButton" noPadding>
                <ArrowUpward htmlColor={actionButtonColor} />
              </IconButton>
            </Tooltip>
          </div>
        )}
        {openForInvestment && isAdmin && !questionResolved && (
          <div onClick={(event) => {
            preventDefaultAndProp(event);
            return changeStage();
          }}>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'demoteOption' })}>
              <IconButton size="small" id="demoteOptionButton" noPadding>
                <ArrowDownward htmlColor={actionButtonColor} />
              </IconButton>
            </Tooltip>
          </div>
        )}
        {parentInvestibleId && (
          <div style={questionResolved ? {paddingRight: '0.5rem'} : undefined} onClick={(event) => {
            preventDefaultAndProp(event);
            return createTask();
          }}>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'makeTask' })}>
              <IconButton size="small" id="makeTaskButton" noPadding>
                <ListAltIcon htmlColor={actionButtonColor} />
              </IconButton>
            </Tooltip>
          </div>
        )}
        {openForInvestment && !yourVote && !questionResolved && (
          <div onClick={(event) => {
            preventDefaultAndProp(event);
            return navigate(history,
              formWizardLink(APPROVAL_WIZARD_TYPE, marketId, investibleId, undefined,
                undefined, typeObjectId));
          }}>
            <Tooltip placement='top' title={intl.formatMessage({ id: `createNewApproval` })}>
              <IconButton size="small" id="approvalButton" noPadding>
                <ThumbsUpDownIcon htmlColor={tColor('vote')} />
              </IconButton>
            </Tooltip>
          </div>
        )}
        {!questionResolved && (
          <>
            <div onClick={(event) => {
                preventDefaultAndProp(event);
                return navigate(history,
                  formInvestibleAddCommentLink(DECISION_COMMENT_WIZARD_TYPE, investibleId, marketId,
                    TODO_TYPE, typeObjectId));
              }}>
                <Tooltip placement='top' title={intl.formatMessage({ id: `createNew${TODO_TYPE}Option` })}>
                  <IconButton size="small" id="createTODOOptionButton" noPadding>
                    <AssignmentIcon htmlColor={tColor('task')} />
                  </IconButton>
                </Tooltip>
            </div>
            <div onClick={(event) => {
                preventDefaultAndProp(event);
                return navigate(history,
                  formInvestibleAddCommentLink(DECISION_COMMENT_WIZARD_TYPE, investibleId, marketId,
                    ISSUE_TYPE, typeObjectId));
              }}>
                <Tooltip placement='top' title={intl.formatMessage({ id: `createNew${ISSUE_TYPE}` })}>
                  <IconButton size="small" id="issueButton" noPadding>
                    <Block htmlColor={tColor('issue')} />
                  </IconButton>
                </Tooltip>
            </div>
            <div onClick={(event) => {
                preventDefaultAndProp(event);
                return navigate(history,
                  formInvestibleAddCommentLink(DECISION_COMMENT_WIZARD_TYPE, investibleId, marketId,
                    SUGGEST_CHANGE_TYPE, typeObjectId));
              }}>
                <Tooltip placement='top' title={intl.formatMessage({ id: `createNew${SUGGEST_CHANGE_TYPE}` })}>
                  <IconButton size="small" id="suggestButton" noPadding>
                    <LightbulbOutlined htmlColor={tColor('suggest')} />
                  </IconButton>
                </Tooltip>
            </div>
            <div style={{paddingRight: '0.5rem'}}  onClick={(event) => {
                preventDefaultAndProp(event);
                return navigate(history,
                  formInvestibleAddCommentLink(DECISION_COMMENT_WIZARD_TYPE, investibleId, marketId,
                    QUESTION_TYPE, typeObjectId));
              }}>
                <Tooltip placement='top' title={intl.formatMessage({ id: `createNew${QUESTION_TYPE}` })}>
                  <IconButton size="small" id="questionButton" noPadding>
                    <QuestionIcon htmlColor={tColor('question')} />
                  </IconButton>
                </Tooltip>
            </div>
          </>
        )}
      </>
    );
  }

  return (
      <Menu
        id="option-menu"
        open
        onClose={recordPositionToggle}
        getContentAnchorEl={null}
        anchorReference="anchorPosition"
        anchorPosition={{ top: mouseY, left: mouseX }}
        anchorOrigin={{
          vertical: "top",
          horizontal: "left",
        }}
        anchorEl={anchorEl}
        disableRestoreFocus
        classes={{ paper: classes.paperMenu }}
      >
        {!openForInvestment && isAdmin && !questionResolved && (
          <MenuItem key="moveOptionVotingKey" id="moveOptionVotingId" style={{backgroundColor: 'white'}}
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      return changeStage().then(() => recordPositionToggle());
                    }}
          >
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><ArrowUpward size='small' style={{marginRight: '0.5rem'}} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'promoteOptionExplanation' })}>
              <ListItemText>
                {intl.formatMessage({ id: 'promoteOption' })}
              </ListItemText>
            </Tooltip>
          </MenuItem>
        )}
        {openForInvestment && isAdmin && !questionResolved && (
          <MenuItem key="moveOptionNotVotingKey" id="moveOptionNotVotingId" style={{backgroundColor: 'white'}}
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      return changeStage().then(() => recordPositionToggle());
                    }}
          >
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><ArrowDownward size='small' style={{marginRight: '0.5rem'}} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'demoteOptionExplanation' })}>
              <ListItemText>
                {intl.formatMessage({ id: 'demoteOption' })}
              </ListItemText>
            </Tooltip>
          </MenuItem>
        )}
        {parentInvestibleId && (
          <MenuItem key="makeTaskKey" id="makeTaskId"
            onClick={(event) => {
              preventDefaultAndProp(event);
              return createTask();
            }}
          >
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><ListAltIcon size='small' 
              style={{marginRight: '0.5rem'}} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'makeTaskExplanation' })}>
              <ListItemText>
                {intl.formatMessage({ id: 'makeTask' })}
              </ListItemText>
            </Tooltip>
          </MenuItem>
        )}
        {openForInvestment && !yourVote && !questionResolved && (
          <MenuItem key="createApprovalKey" id="createApprovalId"
            onClick={(event) => {
              preventDefaultAndProp(event);
              return navigate(history,
                formWizardLink(APPROVAL_WIZARD_TYPE, marketId, investibleId, undefined,
                  undefined, typeObjectId));
            }}
          >
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><ThumbsUpDownIcon size='small'
              htmlColor={tColor('vote')} style={{marginRight: '0.5rem'}} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'createApprovalExplanation' })}>
              <ListItemText>
                {intl.formatMessage({ id: 'createNewApproval' })}
              </ListItemText>
            </Tooltip>
          </MenuItem>
        )}
        {!questionResolved && (
          <MenuItem key="createInfoKey" id="createInfoId"
            onClick={(event) => {
              preventDefaultAndProp(event);
              return navigate(history,
                formInvestibleAddCommentLink(DECISION_COMMENT_WIZARD_TYPE, investibleId, marketId,
                  TODO_TYPE, typeObjectId));
            }}
          >
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><AssignmentIcon size='small'
              htmlColor={tColor('task')} style={{marginRight: '0.5rem'}} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: 'createNewTODOOptionExplanation' })}>
              <ListItemText>
                {intl.formatMessage({ id: `createNew${TODO_TYPE}Option` })}
              </ListItemText>
            </Tooltip>
          </MenuItem>
        )}
        {!questionResolved && (
          <MenuItem key="createIssueKey" id="createIssueId"
            onClick={(event) => {
              preventDefaultAndProp(event);
              return navigate(history,
                formInvestibleAddCommentLink(DECISION_COMMENT_WIZARD_TYPE, investibleId, marketId,
                  ISSUE_TYPE, typeObjectId));
            }}
          >
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><Block size='small'
              htmlColor={tColor('issue')} style={{marginRight: '0.5rem'}} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: `createNew${ISSUE_TYPE}Explanation` })}>
              <ListItemText>
                {intl.formatMessage({ id: `createNew${ISSUE_TYPE}` })}
              </ListItemText>
            </Tooltip>
          </MenuItem>
        )}
        {!questionResolved && (
          <MenuItem key="createSuggestKey" id="createSuggestId"
            onClick={(event) => {
              preventDefaultAndProp(event);
              return navigate(history,
                formInvestibleAddCommentLink(DECISION_COMMENT_WIZARD_TYPE, investibleId, marketId,
                  SUGGEST_CHANGE_TYPE, typeObjectId));
            }}
          >
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><LightbulbOutlined size='small'
              htmlColor={tColor('suggest')} style={{marginRight: '0.5rem'}} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: `createNew${SUGGEST_CHANGE_TYPE}Explanation` })}>
              <ListItemText>
                {intl.formatMessage({ id: `createNew${SUGGEST_CHANGE_TYPE}` })}
              </ListItemText>
            </Tooltip>
          </MenuItem>
        )}
        {!questionResolved && (
          <MenuItem key="createQuestionKey" id="createQuestionId"
            onClick={(event) => {
              preventDefaultAndProp(event);
              return navigate(history,
                formInvestibleAddCommentLink(DECISION_COMMENT_WIZARD_TYPE, investibleId, marketId,
                  QUESTION_TYPE, typeObjectId));
            }}
          >
            <ListItemIcon style={{marginLeft: '-0.25rem', minWidth: '26px'}}><QuestionIcon size='small'
              htmlColor={tColor('question')} style={{marginRight: '0.5rem'}} /></ListItemIcon>
            <Tooltip placement='top' title={intl.formatMessage({ id: `createNew${QUESTION_TYPE}Explanation` })}>
              <ListItemText>
                {intl.formatMessage({ id: `createNew${QUESTION_TYPE}` })}
              </ListItemText>
            </Tooltip>
          </MenuItem>
        )}
      </Menu>
  );
}

export default OptionMenu;
