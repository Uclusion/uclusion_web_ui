import React, { useContext, useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Badge,
  Box,
  CardActions,
  CardContent,
  Checkbox, FormControl,
  FormControlLabel,
  IconButton, MenuItem, Select,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import _ from 'lodash';
import ReadOnlyQuillEditor from '../TextEditors/ReadOnlyQuillEditor';
import {
  ISSUE_TYPE,
  JUSTIFY_TYPE,
  QUESTION_TYPE,
  REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE,
} from '../../constants/comments';
import { reopenComment, resolveComment, updateComment } from '../../api/comments';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import {
  changeMyPresence, usePresences
} from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import CommentEdit from './CommentEdit';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { addMarketToStorage, getMarket, marketTokenLoaded } from '../../contexts/MarketsContext/marketsContextHelper';
import CardType, { BUG, DECISION_TYPE, NOTE } from '../CardType';
import {
  addCommentToMarket, getComment,
  getMarketComments
} from '../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import {
  ACTIVE_STAGE, ARCHIVE_COMMENT_TYPE,
  BUG_WIZARD_TYPE, DELETE_COMMENT_TYPE, IN_PROGRESS_WIZARD_TYPE,
  INITIATIVE_TYPE,
  JOB_COMMENT_CONFIGURE_WIZARD_TYPE,
  JOB_COMMENT_WIZARD_TYPE,
  OPTION_WIZARD_TYPE,
  PLANNING_TYPE,
  REPLY_WIZARD_TYPE
} from '../../constants/markets';
import { red } from '@material-ui/core/colors';
import UsefulRelativeTime from '../TextFields/UseRelativeTime';
import {
  addInvestible,
  getInvestible,
  getMarketInvestibles
} from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import {
  getFurtherWorkStage,
  getInReviewStage, getNotDoingStage,
  getProposedOptionsStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import {
  decomposeMarketPath,
  formCommentLink, formInboxItemLink,
  formInvestibleAddCommentLink,
  formMarketAddInvestibleLink,
  formWizardLink,
  navigate,
  preventDefaultAndProp
} from '../../utils/marketIdPathFunctions';
import { useHistory, useLocation } from 'react-router';
import { marketAbstain } from '../../api/markets';
import {
  changeInvestibleStage,
  handleAcceptSuggestion,
  isSingleAssisted,
  onCommentOpen
} from '../../utils/commentFunctions';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import {
  findMessageForCommentId,
  removeInlineMarketMessages,
  removeMessagesForCommentId
} from '../../utils/messageUtils';
import GravatarAndName from '../Avatars/GravatarAndName';
import { invalidEditEvent } from '../../utils/windowUtils';
import AddIcon from '@material-ui/icons/Add';
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton';
import {
  Done,
  Edit,
  Eject,
  ExpandLess,
  NotificationsActive,
  NotInterested,
  SettingsBackupRestore,
  UnfoldMore
} from '@material-ui/icons';
import ReplyIcon from '@material-ui/icons/Reply';
import TooltipIconButton from '../Buttons/TooltipIconButton';
import { getPageReducerPage, usePageStateReducer } from '../PageState/pageStateHooks';
import InlineInitiativeBox from '../../containers/CommentBox/InlineInitiativeBox';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { getDiff } from '../../contexts/DiffContext/diffContextHelper';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import DiffDisplay from '../TextEditors/DiffDisplay';
import LoadingDisplay from '../LoadingDisplay';
import { pushMessage } from '../../utils/MessageBusUtils';
import { GUEST_MARKET_EVENT, LOAD_MARKET_CHANNEL } from '../../contexts/MarketsContext/marketsContextMessages';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import { userIsLoaded } from '../../contexts/AccountContext/accountUserContextHelper';
import InvesibleCommentLinker from '../../pages/Dialog/InvesibleCommentLinker';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { ScrollContext } from '../../contexts/ScrollContext';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import SettingsIcon from '@material-ui/icons/Settings';
import Options from './Options';
import Reply from './Reply';
import { isLargeDisplay, stripHTML } from '../../utils/stringFunctions';
import Gravatar from '../Avatars/Gravatar';
import styled from 'styled-components';
import { NOT_FULLY_VOTED_TYPE, RED_LEVEL } from '../../constants/notifications';
import NotificationDeletion from '../../pages/Home/YourWork/NotificationDeletion';
import { dehighlightMessage, getInboxTarget } from '../../contexts/NotificationsContext/notificationsContextHelper';
import EditIcon from '@material-ui/icons/Edit';
import ListAltIcon from '@material-ui/icons/ListAlt';
import { hasReply } from '../AddNewWizards/Reply/ReplyStep';
import { previousInProgress } from '../AddNewWizards/TaskInProgress/TaskInProgressWizard';
import { getMarketClient } from '../../api/marketLogin';
import { isMyPokableComment } from '../../pages/Home/YourWork/InboxExpansionPanel';
import { GroupMembersContext } from '../../contexts/GroupMembersContext/GroupMembersContext';

export const useCommentStyles = makeStyles(
  theme => {
    return {
      chip: {
        margin: 0,
        marginBottom: 18
      },
      content: {
        marginTop: '12px',
        fontSize: 15,
        lineHeight: "175%"
      },
      cardContent: {
        paddingTop: 0,
        paddingRight: "20px",
        paddingLeft: "20px",
        paddingBottom: "0.75rem",
        overflowY: 'hidden'
      },
      cardActions: {
        padding: "8px"
      },
      actionsEnd: {
        display: "flex",
        justifyContent: "flex-end",
        boxShadow: "none",
        width: "100%"
      },
      actions: {
        display: "flex",
        boxShadow: "none",
        width: "100%"
      },
      action: {
        boxShadow: "none",
        fontSize: 12,
        padding: "4px 16px, 0, 0",
        textTransform: "none",
        "&:hover": {
          boxShadow: "none"
        }
      },
      actionPrimary: {
        backgroundColor: '#2D9CDB',
        color: 'white',
        textTransform: 'unset',
        padding: 0,
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
        padding: 0,
        marginRight: '20px',
        '&:hover': {
          backgroundColor: '#F1F1F1'
        }
      },
      actionWarned: {
        backgroundColor: "#BDBDBD",
        color: "black",
        "&:hover": {
          backgroundColor: red["400"],
        }
      },
      updatedBy: {
        alignSelf: "baseline",
        color: "#434343",
        fontWeight: "bold",
        fontSize: 12,
        lineHeight: 1.75,
        marginLeft: "auto"
      },
      actionResolveToggle: {
        margin: "11px 12px 11px 16px",
        [theme.breakpoints.down('sm')]: {
          margin: "11px 6px 11px 3px",
        },
      },
      actionEdit: {
        alignSelf: "baseline",
        margin: "11px 0px 11px 16px",
        [theme.breakpoints.down('sm')]: {
          margin: "11px 0px 11px 3px",
        },
      },
      commentType: {
        alignSelf: "start",
        display: "inline-flex"
      },
      smallGravatar: {
        width: '30px',
        height: '30px',
        marginTop: '2px'
      },
      createdBy: {
        fontSize: '15px',
        whiteSpace: 'nowrap'
      },
      childWrapper: {
        // borderTop: '1px solid #DCDCDC',
      },
      initialComment: {
        display: "flex"
      },
      avatarWrapper: {
        marginRight: "20px"
      },
      containerRed: {
        boxShadow: "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px red",
        overflow: "visible",
        marginTop: "0.5rem"
      },
      containerYellow: {
        boxShadow: "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px yellow",
        overflow: "visible",
        marginTop: "0.5rem"
      },
      containerBlueLink: {
        boxShadow: "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px blue",
        overflow: "visible",
        marginTop: "0.5rem",
        cursor: 'pointer'
      },
      containerHashYellow: {
        backgroundColor: "#FBF6D8",
        overflow: "visible",
        marginTop: "1.5rem",
        cursor: 'pointer'
      },
      containerLink: {
        overflow: "visible",
        cursor: 'pointer'
      },
      container: {
        overflow: "visible",
        marginTop: "1.5rem"
      },
      timeElapsed: {
        whiteSpace: 'nowrap',
        paddingRight: '10px',
        paddingTop: '5px'
      },
      todoLabelType: {
        [theme.breakpoints.down('sm')]: {
          display: 'block',
          marginLeft: 'auto',
          marginRight: 'auto'
        }
      },
      commentTypeGroup: {
        display: "flex",
        flexDirection: "row",
        [theme.breakpoints.down('sm')]: {
          display: 'block'
        }
      },
      chipItem: {
        color: '#fff',
        borderRadius: '8px',
        '& .MuiChip-label': {
          fontSize: 12,
        },
        '& .MuiFormControlLabel-label': {
          paddingRight: '5px',
          fontWeight: 'bold',
          textTransform: 'capitalize',
          [theme.breakpoints.down('sm')]: {
            height: '100%',
            verticalAlign: 'middle',
            display: 'inline-block',
            '& .MuiSvgIcon-root': {
              display: 'block'
            }
          },
        },
        '& .MuiChip-avatar': {
          width: '16px',
          height: '14px',
          color: '#fff',
        },
        '& .MuiRadio-colorPrimary.Mui-checked':{
          '&.Mui-checked': {
            color: 'white'
          }
        },
        paddingRight: theme.spacing(1),
        paddingLeft: theme.spacing(1),
        margin: theme.spacing(0, 0, 0, 4),
        [theme.breakpoints.down('sm')]: {
          margin: '10px'
        },
      },
      selected: {
        opacity: 1
      },
      unselected: {
        opacity: '.6'
      },
      chipItemQuestion: {
        background: '#2F80ED',
      },
      chipItemIssue: {
        background: '#E85757',
        color: 'black'
      },
      chipItemSuggestion: {
        background: '#e6e969',
        color: 'black'
      },
      commentTypeContainer: {
        borderRadius: '4px 4px 0 0'
      },
      button: {
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 'bold',
        margin: 8
      },
      compressedComment: {
        paddingLeft: '1rem',
        paddingTop: '0.25rem',
        color: 'black',
        textOverflow: 'ellipsis',
        whiteSpace: 'nowrap',
        overflow: 'hidden',
        paddingRight: '0.5rem',
        marginRight: '0.5rem',
        marginTop: '0.25rem'
      }
  }
},
{ name: "Comment" }
);


export const LocalCommentsContext = React.createContext(null);

const StyledBadge = styled(Badge)(() => ({
  '& .MuiBadge-badge': {
    right: -3,
    top: 13,
    marginRight: 4,
    marginLeft: 8
  },
  '& .MuiBadge-anchorOriginTopRightRectangle': {
    paddingTop: '3px'
  }
}));

function getCompressionButton(numberHidden, inboxMessageId, toggleCompression, intl) {
  return (
    <IconButton id={`removeCompressed${inboxMessageId}`} onClick={toggleCompression}
                style={{border: '1px solid grey', marginTop: -11, marginBottom: -11}}>
      <Tooltip key={`tipCompressed${inboxMessageId}`}
               title={intl.formatMessage({ id: 'removeCompressionExplanation' })}>
        <StyledBadge badgeContent={numberHidden} style={{paddingRight: '7px'}} >
          <UnfoldMore />
        </StyledBadge>
      </Tooltip>
    </IconButton>
  );
}

function InitialReply(props) {
  const { comment, enableEditing, replyEditId, inboxMessageId, isInbox, wizardProps,
    numberHidden = 0, useCompression, toggleCompression, myPresenceIsAssigned } = props;
  const intl = useIntl();
  if (numberHidden > 0) {
    return (
      <>
        {getCompressionButton(numberHidden, inboxMessageId, toggleCompression, intl)}
        <Reply comment={comment} enableEditing={enableEditing} replyEditId={replyEditId}
               useCompression={useCompression} toggleCompression={toggleCompression}
               myPresenceIsAssigned={myPresenceIsAssigned}
               inboxMessageId={inboxMessageId} isInbox={isInbox} wizardProps={wizardProps}/>
      </>
    );
  }
  return <Reply comment={comment} enableEditing={enableEditing} replyEditId={replyEditId}
                useCompression={useCompression} toggleCompression={toggleCompression}
                myPresenceIsAssigned={myPresenceIsAssigned}
                inboxMessageId={inboxMessageId} isInbox={isInbox} wizardProps={wizardProps}/>;
}

function calculateNumberHidden(comment, inboxMessageId, comments, parent) {
  const wholeThreadBelow = comments.filter((aComment) => aComment.root_comment_id === comment.id);
  const sizeWholeThreadBelow = _.size(wholeThreadBelow);
  if (!inboxMessageId) {
    return sizeWholeThreadBelow;
  }
  let notifiedDescendants = [];
  let immediateDescendants = comments.filter((aComment) => aComment.reply_id === inboxMessageId);
  while(_.size(immediateDescendants) > 0) {
    notifiedDescendants = notifiedDescendants.concat(immediateDescendants);
    const immediateDescendantIds = immediateDescendants.map((aComment) => aComment.id);
    immediateDescendants = comments.filter((aComment) => immediateDescendantIds.includes(aComment.reply_id));
  }
  const sizeThreadNotBelowNotified = sizeWholeThreadBelow - _.size(notifiedDescendants);
  return parent.id === inboxMessageId ? sizeThreadNotBelowNotified - 1 : sizeThreadNotBelowNotified - 2;
}

function findParentInDescendants(useComment, inboxMessageId, comments) {
  const notifiedComment = comments.find((comment) => comment.id === inboxMessageId);
  const notifiedParentId = notifiedComment?.reply_id;
  if (notifiedParentId === notifiedComment?.root_comment_id) {
    if (useComment.id === inboxMessageId) {
      // If this is a reply to the root then return it
      return notifiedComment;
    }
    return undefined;
  }
  const notifiedParent = comments.find((comment) => comment.id === notifiedParentId);
  let found = false;
  let commentPointer = notifiedParent;
  while(commentPointer?.reply_id) {
    if (useComment.id === commentPointer.id) {
      found = true;
      break;
    }
    // eslint-disable-next-line no-loop-func
    commentPointer = comments.find((comment) => comment.id === commentPointer.reply_id);
  }
  return found ? notifiedParent : undefined;
}

function sortInProgress(aComment) {
  return !aComment.in_progress;
}

function sortSubTask(parentCreatedBy) {
  return (aComment) => aComment.created_by !== parentCreatedBy;
}

function isSubTask(comment, commentsState, isTask) {
  if (!isTask) {
    return false;
  }
  const parent = getComment(commentsState, comment.market_id, comment.reply_id);
  return parent?.created_by === comment.created_by;
}

/**
 * A question or issue
 * @param {{comment: Comment, comments: Comment[]}} props
 */
function Comment(props) {
  const { comment, marketId, comments, noAuthor, reallyNoAuthor, isReply, wizardProps,
    resolvedStageId, stagePreventsActions, isInbox, replyEditId, currentStageId, marketInfo, investible, removeActions,
    inboxMessageId, toggleCompression: toggleCompressionRaw, useCompression, showVoting, selectedInvestibleIdParent,
    isMove, idPrepend='c', usePadding=true, compressAll=false, focusMove=false } = props;
  const history = useHistory();
  const location = useLocation();
  const editBox = useRef(null);
  const theme = useTheme();
  const isReallyMobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const mediumLayout = useMediaQuery('(min-width:1400px)');
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [groupPresencesState] = useContext(GroupMembersContext);
  const intl = useIntl();
  const classes = useCommentStyles();
  const { id, comment_type: commentType, investible_id: investibleId, inline_market_id: inlineMarketId,
    resolved, notification_type: myNotificationType, body, is_sent: isSent, group_id: groupId,
    in_progress: inProgress } = comment;
  const { pathname } = location;
  const { marketId: typeObjectIdRaw, action } = decomposeMarketPath(pathname);
  const typeObjectId = action === 'inbox' ? typeObjectIdRaw : undefined;
  const beingEdited = replyEditId === id;
  const replyBeingEdited = beingEdited && isReply;
  const thisCommentBeingEdited = beingEdited && !replyBeingEdited;
  const presences = usePresences(marketId);
  const inlinePresences = usePresences(inlineMarketId);
  const isSingleUser = _.size(presences) < 2;
  const createdBy = useCommenter(comment, presences) || unknownPresence;
  const updatedBy = useUpdatedBy(comment, presences) || unknownPresence;
  const [marketsState, marketDispatch, tokensHash] = useContext(MarketsContext);
  const inlineMarket = getMarket(marketsState, inlineMarketId) || {};
  const market = getMarket(marketsState, marketId) || {};
  const { market_stage: marketStage, market_type: marketType } = market;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const { assigned: invAssigned } = marketInfo || {};
  const assigned = invAssigned || [];
  const myPresenceIsAssigned = assigned.includes(myPresence.id);
  const myInlinePresence = inlinePresences.find((presence) => presence.current_user) || {};
  const inArchives = !activeMarket;
  const replies = comments.filter(comment => comment.reply_id === id);
  const sortedReplies = commentType === TODO_TYPE && investibleId
    ? _.sortBy(replies, sortInProgress, sortSubTask(comment.created_by), "created_at")
    : _.sortBy(replies, "created_at");
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState, presenceDispatch] = useContext(MarketPresencesContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [diffState] = useContext(DiffContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [userState] = useContext(AccountContext);
  const [hashFragment, noHighlightId, setNoHighlightId] = useContext(ScrollContext);
  const hasUser = userIsLoaded(userState, marketsState);
  const enableActions = !inArchives && !stagePreventsActions;
  const enableEditing = enableActions && !resolved; //resolved comments or those in archive aren't editable
  const [editStateFull, editDispatch] = usePageStateReducer('commentEdit');
  const [editState, updateEditState, editStateReset] = getPageReducerPage(editStateFull, editDispatch, id);
  const {
    showDiff: storedShowDiff
  } = editState;
  const showDiff = storedShowDiff || storedShowDiff === undefined;
  const myMessage = findMessageForCommentId(id, messagesState);
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
  const inReviewStageId = inReviewStage.id;
  const inBacklogStage = getFurtherWorkStage(marketStagesState, marketId) || {};
  const inBacklog = currentStageId === inBacklogStage.id;
  const createdInReview = currentStageId === inReviewStageId;
  const loading = !hasUser || !myPresence || !marketType || !marketTokenLoaded(marketId, tokensHash)
    || (inlineMarketId && _.isEmpty(inlineMarket));
  const notDoingStage = getNotDoingStage(marketStagesState, marketId) || {};
  const otherInProgress = previousInProgress(myPresence.id, comment, investiblesState, commentsState, notDoingStage.id);

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (inlineMarketId && !marketsState.initializing && hasUser && !operationRunning) {
      const inlineMarketLoaded = getMarket(marketsState, inlineMarketId);
      if (_.isEmpty(inlineMarketLoaded)) {
        // Eventual consistency means there is a chance we were not invited to this inline market
        pushMessage(LOAD_MARKET_CHANNEL, { event: GUEST_MARKET_EVENT, marketId: inlineMarketId });
      }
    }
  }, [hasUser, marketsState, inlineMarketId, operationRunning]);

  function toggleCompression() {
    toggleCompressionRaw(id);
  }

  function toggleDiffShow(event) {
    preventDefaultAndProp(event)
    updateEditState({showDiff: !showDiff});
  }

  function toggleEdit(event) {
    preventDefaultAndProp(event);
    if (replyEditId) {
      setNoHighlightId(undefined);
      navigate(history, formCommentLink(marketId, groupId, investibleId, id));
    } else {
      setNoHighlightId(id);
      navigate(history, `/comment/${marketId}/${id}`, false, true);
    }
  }

  function setBeingEdited(event) {
    if (isReallyMobileLayout || invalidEditEvent(event, history)) {
      return;
    }
    toggleEdit(event);
  }

  const isMarketTodo = marketType === PLANNING_TYPE && commentType === TODO_TYPE && !investibleId && !isMove;
  const isTask = marketType === PLANNING_TYPE && commentType === TODO_TYPE && investibleId;
  const isInfo = marketType === DECISION_TYPE && commentType === TODO_TYPE && investibleId;
  const isEditable = comment.created_by === myPresence.id || isMarketTodo || (isTask && myPresenceIsAssigned);

  function getDialog(anInlineMarket) {
    return (
      <Options anInlineMarket={anInlineMarket} marketId={marketId} investibleId={investibleId} inArchives={inArchives}
               isEditable={isEditable} isSent={isSent} groupId={groupId} removeActions={removeActions} isInbox={isInbox}
               selectedInvestibleIdParent={selectedInvestibleIdParent} searchResults={searchResults}
               useCompression={useCompression} />
    );
  }

  function getDecision(aMarketId) {
    const anInlineMarket = getMarket(marketsState, aMarketId);
    if (!anInlineMarket) {
      return React.Fragment;
    }
    const { parent_comment_id: parentCommentId, market_stage: marketStage, market_type: marketType } = anInlineMarket;
    if (!parentCommentId || (removeActions && !showVoting)) {
      return React.Fragment;
    }
    if (marketType === INITIATIVE_TYPE) {
      return <InlineInitiativeBox anInlineMarket={anInlineMarket} removeActions={removeActions} isInbox={isInbox}
                                  isTaskDisplay={commentType === TODO_TYPE} typeObjectId={typeObjectId} createdBy={createdBy}
                                  inArchives={marketStage !== ACTIVE_STAGE || inArchives || resolved} />;
    }
    return getDialog(anInlineMarket);
  }

  function reopen() {
    return reopenComment(marketId, id)
      .then((comment) => {
        if (inlineMarket?.market_type === DECISION_TYPE && comment.market_id === inlineMarketId) {
          if (commentType === ISSUE_TYPE) {
            const proposedStage = getProposedOptionsStage(marketStagesState, inlineMarketId);
            const inv = getInvestible(investiblesState, investibleId) || {};
            const [info] = (inv.market_infos || []);
            const { stage } = (info || {});
            if (proposedStage && stage !== proposedStage.id) {
              changeInvestibleStage(proposedStage, assigned, comment.updated_at, info, inv.market_infos, inv.investible,
                investiblesDispatch);
            }
          }
        } else {
          onCommentOpen(investiblesState, investibleId, marketStagesState, marketId, comment, investiblesDispatch,
            commentsState, commentsDispatch, myPresence);
        }
        if (inlineMarket && inlineMarket.market_stage !== 'Active') {
          // re-open inline market
          const newInlineMarket = {...inlineMarket, market_stage: 'Active'};
          addMarketToStorage(marketDispatch, newInlineMarket);
        }
        // The only message that will be there is the one telling you the comment was resolved
        removeMessagesForCommentId(id, messagesState);
        setOperationRunning(false);
      });
  }

  function abstain(abstain) {
    setOperationRunning(true);
    return marketAbstain(inlineMarketId, abstain)
      .then(() => {
        const newValues = {
          abstain,
        }
        changeMyPresence(marketPresencesState, presenceDispatch, inlineMarketId, newValues)
        removeMessagesForCommentId(id, messagesState)
        setOperationRunning(false);
        if (isInbox) {
          navigate(history, getInboxTarget());
        }
      });
  }

  function resolve() {
    if (!investibleId) {
      if (typeObjectId) {
        return navigate(history, `${formWizardLink(ARCHIVE_COMMENT_TYPE, marketId, undefined,
          undefined, id)}&isInbox=${isInbox === true}&typeObjectId=${typeObjectId}`);
      }
      return navigate(history, `${formWizardLink(ARCHIVE_COMMENT_TYPE, marketId, undefined, 
        undefined, id)}&isInbox=${isInbox === true}`);
    }
    return resolveComment(marketId, id)
      .then((response) => {
        const comment = commentType === REPORT_TYPE ? response['comment'] : response;
        addCommentToMarket(comment, commentsState, commentsDispatch);
        const isTriage = typeObjectIdRaw?.startsWith('UNASSIGNED_');
        let criticalCommentsNumber = 0;
        if (isTriage) {
          const marketComments = getMarketComments(commentsState, marketId, groupId);
          criticalCommentsNumber = _.size(marketComments?.filter((comment) => comment.comment_type === TODO_TYPE &&
            !comment.investible_id && comment.notification_type === RED_LEVEL && !comment.resolved));
        }
        removeMessagesForCommentId(id, messagesState);
        if (inlineMarketId) {
          removeInlineMarketMessages(inlineMarketId, investiblesState, commentsState, messagesState, messagesDispatch);
        }
        if (commentType === REPORT_TYPE) {
          addInvestible(investiblesDispatch, () => {}, response['investible']);
        } else if (resolvedStageId) {
          const newInfo = {
            ...marketInfo,
            stage: resolvedStageId,
            last_stage_change_date: comment.updated_at,
          };
          const newInfos = _.unionBy([newInfo], investible.market_infos, 'id');
          const newInvestible = {
            investible: investible.investible,
            market_infos: newInfos
          };
          addInvestible(investiblesDispatch, () => {}, newInvestible);
        }
        setOperationRunning(false);
        if (isInbox || criticalCommentsNumber === 1) {
          navigate(history, getInboxTarget());
        }
      });
  }

  function handleToggleInProgress() {
    setOperationRunning(`inProgressCheckbox${id}`);
    const sendToWizard = !inProgress && !_.isEmpty(otherInProgress);
    return updateComment({marketId, commentId: id, inProgress: !inProgress}).then((comment) => {
      setOperationRunning(false);
      addCommentToMarket(comment, commentsState, commentsDispatch)
      if (sendToWizard) {
        navigate(history, formWizardLink(IN_PROGRESS_WIZARD_TYPE, marketId, undefined, undefined, id));
      }
    });
  }

  const diff = getDiff(diffState, id);
  const { level: myHighlightedLevel } = myMessage || {};
  // For some reason can't stop propagation on clicking edit so just turn off in that case
  const isNavigateToInbox = myHighlightedLevel && !isEditable && !replyEditId;
  const isNote = commentType === REPORT_TYPE && _.isEmpty(investibleId);
  const overrideLabel = commentType === REPLY_TYPE ? (isSubTask(comment, commentsState, isTask) ? 
        <FormattedMessage id="commentSubTaskLabel" /> :
        <FormattedMessage id="issueReplyLabel" />) : (isInfo ? <FormattedMessage id="todoInfo" /> :
      (isNote ? <FormattedMessage id="reportNote" /> : undefined ) );
  const color = isMarketTodo ? myNotificationType : undefined;
  const displayUpdatedBy = updatedBy !== undefined && comment.updated_by !== comment.created_by;
  const showActions = (!replyBeingEdited || replies.length > 0) && !removeActions;
  function getCommentHighlightStyle() {
    if (isInbox) {
      if (!inboxMessageId || inboxMessageId === id) {
        return classes.containerBlueLink;
      }
      return classes.containerLink;
    }
    if (isNavigateToInbox) {
      return classes.containerBlueLink;
    }
    if (noHighlightId !== id && hashFragment?.includes(id)) {
      return classes.containerHashYellow;
    }
    return classes.container;
  }

  function onNotificationTypeChange(event) {
    setOperationRunning(true);
    removeMessagesForCommentId(id, messagesState);
    const { value: notificationType } = event.target;
    return updateComment({marketId, commentId: id, notificationType})
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        setOperationRunning(false);
        navigate(history, formCommentLink(marketId, groupId, investibleId, id));
      }).finally(() => {
        setOperationRunning(false);
      });
  }

  function moveToTask() {
    return updateComment({marketId, commentId: id, commentType: TODO_TYPE}).then((taskComment) => {
      handleAcceptSuggestion({
        isMove: myPresenceIsAssigned && myPresence.id === comment.created_by &&
          isSingleAssisted(comments, assigned), comment: taskComment, investible, investiblesDispatch, marketStagesState,
        commentsState, commentsDispatch, messagesState
      });
      setOperationRunning(false);
      navigate(history, formCommentLink(marketId, taskComment.group_id, taskComment.investible_id, taskComment.id));
    });
  }

  const displayingDiff = showDiff && diff;
  const displayEditing = enableEditing && isEditable && !isInbox;
  if (loading) {
    return (
      <div className={classes.container}>
        <LoadingDisplay showMessage messageId="commentLoadingMessage" noMargin/>
      </div>
    )
  }

  const showMoveButton = isSent !== false
    && [TODO_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE].includes(commentType)
    && !inArchives && !removeActions && enableActions && marketType === PLANNING_TYPE;
  const showMakeTaskButton = showMoveButton && (myPresenceIsAssigned || inBacklog || myPresence === createdBy)
    && commentType === SUGGEST_CHANGE_TYPE;
  const inlineInvestibles = getMarketInvestibles(investiblesState, inlineMarketId);
  const showConfigureVotingButton = commentType === QUESTION_TYPE && !inArchives &&
    !_.isEmpty(inlineInvestibles) && !resolved && !removeActions && myPresence === createdBy;
  const showResolve = isSent !== false && enableActions && !resolved && !removeActions && !isInfo;
  const showReopen = resolved && !removeActions && enableActions && commentType !== REPORT_TYPE;
  const showAddVoting = commentType === SUGGEST_CHANGE_TYPE && !inArchives && !resolved && !inlineMarketId
    && marketType === PLANNING_TYPE && !removeActions && !isSingleUser;
  const yourVote = myInlinePresence && myInlinePresence.investments &&
    myInlinePresence.investments.find((investment) => !investment.deleted);
  const showAbstain = enableActions && inlineMarketId && myPresence !== createdBy && !resolved &&
    !myInlinePresence.abstain && !yourVote && !removeActions && myMessage?.type === NOT_FULLY_VOTED_TYPE;
  const showUnmute = !removeActions && myInlinePresence.abstain && !resolved && enableActions
    && ([QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(commentType));
  const showSubTask = isTask && myPresence === createdBy;
  const isDeletable = !isInbox && !beingEdited && (commentType === REPORT_TYPE || isEditable || resolved);
  const linker = 
    <div style={{marginRight: '1rem', marginTop: '-0.25rem'}}>
      <InvesibleCommentLinker commentId={id} investibleId={investibleId} marketId={marketId} />
    </div>;
  const gravatarWithName = useCompression && inboxMessageId ?
    <Gravatar name={createdBy.name} email={createdBy.email} className={classes.smallGravatar}/>
    : <GravatarAndName key={myPresence.id} email={createdBy.email} useMarginBottom='10px'
                                            name={createdBy.name} typographyVariant="caption"
                                            typographyClassName={classes.createdBy}
                                            avatarClassName={classes.smallGravatar}
  />;
  const showLinker = !mobileLayout && !isInbox && !beingEdited && ![JUSTIFY_TYPE, REPLY_TYPE].includes(commentType)
  && marketType !== DECISION_TYPE;
  const cardTypeDisplay = overrideLabel ? (
    <CardType className={classes.commentType} type={commentType} resolved={resolved} compact
              subtype={commentType === TODO_TYPE && _.isEmpty(investibleId) ? BUG : (commentType === REPLY_TYPE ?
                TODO_TYPE : (isNote ? NOTE :undefined))} linker={(reallyNoAuthor || isMarketTodo) && showLinker && linker}
              label={overrideLabel} color={color} compressed={useCompression}
              gravatar={noAuthor || mobileLayout ? undefined : gravatarWithName}
    />
  ): (
    <CardType className={classes.commentType} type={commentType} resolved={resolved} compact compressed={useCompression}
              gravatar={noAuthor || mobileLayout ? undefined : gravatarWithName} 
              linker={(reallyNoAuthor || isMarketTodo) && showLinker && linker}
    />
  );
  const deleteWizardBaseLink = formWizardLink(DELETE_COMMENT_TYPE, marketId, undefined,
    undefined, id);
  const dateInfo = <>
    {mobileLayout && (
      <Typography className={classes.timeElapsed} variant="body2">
        {intl.formatDate(comment.updated_at)}
      </Typography>
    )}
    {!mobileLayout && (
      <Typography className={classes.timeElapsed} variant="body2" style={{paddingLeft: '1rem'}}>
        Created <UsefulRelativeTime value={comment.created_at}/>
        {noAuthor && !reallyNoAuthor &&
          `${intl.formatMessage({ id: 'lastUpdatedBy' })} ${createdBy.name}`}.
        {comment.created_at < comment.updated_at && !resolved && mediumLayout && (
          <> Updated <UsefulRelativeTime value={comment.updated_at}/></>
        )}
        {resolved && mediumLayout && (
          <> Resolved <UsefulRelativeTime value={comment.updated_at}/></>
        )}
        {comment.created_at < comment.updated_at && !displayUpdatedBy && mediumLayout && (
          <>.</>
        )}
        {displayUpdatedBy && mediumLayout &&
          `${intl.formatMessage({ id: 'lastUpdatedBy' })} ${updatedBy.name}.`}
      </Typography>
    )}
  </>;
  const endActions = <>{showConfigureVotingButton && (
    <SpinningIconLabelButton
      onClick={() => navigate(history, formWizardLink(JOB_COMMENT_CONFIGURE_WIZARD_TYPE, marketId,
        undefined, undefined, id, typeObjectId))}
      doSpin={false} icon={SettingsIcon} iconOnly={mobileLayout}>
      {!mobileLayout && intl.formatMessage({ id: 'configureVoting' })}
    </SpinningIconLabelButton>
  )}
  {showMakeTaskButton && !mobileLayout && (
    <SpinningIconLabelButton
      onClick={() => {
        if (myPresenceIsAssigned) {
          return moveToTask();
        }
        navigate(history, `${formMarketAddInvestibleLink(marketId, groupId, undefined, 
          typeObjectId, BUG_WIZARD_TYPE)}&fromCommentId=${id}&useType=Task`);
      }}
      id={`makeTask${id}`}
      doSpin={myPresenceIsAssigned}
      icon={ListAltIcon}
      focus={focusMove}
    >
      {intl.formatMessage({ id: 'makeTask' })}
    </SpinningIconLabelButton>
  )}
  {showMoveButton && !mobileLayout && (
    <SpinningIconLabelButton
      onClick={() => navigate(history,
        `${formMarketAddInvestibleLink(marketId, groupId, undefined, typeObjectId,
          investibleId && [TODO_TYPE, SUGGEST_CHANGE_TYPE].includes(commentType) ?
            BUG_WIZARD_TYPE : undefined)}&fromCommentId=${id}`)}
      id={`moveComment${id}`}
      doSpin={false}
      icon={Eject}
      focus={focusMove && !showMakeTaskButton}
    >
      {intl.formatMessage({ id: "storyFromComment" })}
    </SpinningIconLabelButton>
  )}
  {((resolved && showReopen) || (!resolved && showResolve)) && !mobileLayout && (
    <SpinningIconLabelButton
      doSpin={(investibleId || resolved) && (resolved || commentType !== REPORT_TYPE)}
      onClick={resolved ? reopen : (commentType === REPORT_TYPE && investibleId ? () => navigate(history,
        `${formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId,
          REPORT_TYPE)}&resolveId=${id}`) : resolve)}
      icon={resolved ? SettingsBackupRestore : Done}
      id={`commentResolveReopenButton${id}`}
    >
      {intl.formatMessage({ id: resolved ? 'commentReopenLabel' : 'commentResolveLabel' })}
    </SpinningIconLabelButton>
  )}
  {diff && (
    <SpinningIconLabelButton icon={showDiff ? ExpandLess : ExpandMoreIcon} iconOnly={mobileLayout}
                             onClick={(event) => toggleDiffShow(event)}
                             doSpin={false}>
      {!mobileLayout && intl.formatMessage({ id: showDiff ? 'diffDisplayDismissLabel' : 'diffDisplayShowLabel'})}
    </SpinningIconLabelButton>
  )}</>;
  const commentCard = <div style={{overflow: 'unset', backgroundColor: 'white', marginTop: isSent === false || usePadding === false ? 0
      : '1rem', width: removeActions ? 'fit-content' : undefined}} className={getCommentHighlightStyle()}
                            ref={editBox}>
    <div onClick={(event) => {
      if (!invalidEditEvent(event, history)) {
        if (isInbox) {
          navigate(history, formCommentLink(marketId, groupId, investibleId, id));
        } else if (isNavigateToInbox && myMessage.type_object_id) {
          dehighlightMessage(myMessage, messagesDispatch);
          navigate(history, formInboxItemLink(myMessage));
        }
      }
    }}>
      <div style={{display: 'flex'}}>
        {cardTypeDisplay}
        <div style={{flexGrow: 1}}/>
        {(beingEdited || ![JUSTIFY_TYPE, REPLY_TYPE].includes(commentType)) && dateInfo}
        {displayEditing && isReallyMobileLayout && !beingEdited && (
          <TooltipIconButton
            onClick={toggleEdit}
            icon={<Edit fontSize='small' style={{marginRight: '1rem'}} />}
            translationId="edit"
          />
        )}
        {showLinker && !reallyNoAuthor && !isMarketTodo && linker}
        {isMyPokableComment(comment, presences, groupPresencesState, marketId) && enableActions && isEditable && !beingEdited && (
          <TooltipIconButton
            disabled={operationRunning !== false}
            onClick={(event) => {
              preventDefaultAndProp(event);
              setOperationRunning(true);
              return getMarketClient(marketId).then((client) => client.users.pokeComment(comment.id).then(() => setOperationRunning(false)));
            }}
            icon={<NotificationsActive fontSize='small' /> }
            size='small'
            translationId='poke'
            doFloatRight
            noAlign
          />
        )}
        {(myPresence.is_admin || isEditable) && enableActions && isDeletable && (
          <div style={{marginRight: '2rem'}}>
            <TooltipIconButton
              disabled={operationRunning !== false}
              onClick={isInbox ? () => navigate(history, `${deleteWizardBaseLink}&isInbox=${isInbox}`) :
                () => navigate(history, deleteWizardBaseLink)}
              icon={<NotificationDeletion isRed={operationRunning === false} />}
              size={mobileLayout ? 'small' : undefined}
              translationId="commentRemoveLabel"
            />
          </div>
        )}
      </div>
      <CardContent className={classes.cardContent}>
        {!noAuthor && mobileLayout && !beingEdited && (
          <GravatarAndName
            key={myPresence.id}
            email={createdBy.email}
            name={createdBy.name}
            typographyVariant="caption"
            typographyClassName={classes.createdBy}
            avatarClassName={classes.smallGravatar}
          />
        )}
        <Box marginTop={1}>
          {!thisCommentBeingEdited && !displayingDiff && !_.isEmpty(comment) && (
            <ReadOnlyQuillEditor value={body} setBeingEdited={setBeingEdited}
                                 noOverflow={isInbox}
                                 id={isInbox ? `inboxComment${id}` : id}
                                 isEditable={!isReallyMobileLayout && displayEditing}/>
          )}
          {!thisCommentBeingEdited && displayingDiff && (
            <DiffDisplay id={id} />
          )}
          {thisCommentBeingEdited && (
            <CommentEdit
              marketId={marketId}
              comment={comment}
              onSave={toggleEdit}
              onCancel={toggleEdit}
              editState={editState}
              updateEditState={updateEditState}
              editStateReset={editStateReset}
              myNotificationType={myNotificationType}
              isInReview={createdInReview}
              messages={myMessage ? [myMessage] : []}
            />
          )}
        </Box>
      </CardContent>
      {!showActions && !thisCommentBeingEdited && useCompression === false && (
        <CardActions>
          <div className={classes.actions}>
            <SpinningIconLabelButton
              icon={ExpandLess}
              toolTipId='commentCloseThreadLabelExplanation'
              doSpin={false}
              onClick={(event) => {
                preventDefaultAndProp(event);
                toggleCompression();
              }}
            >
              {intl.formatMessage({ id: 'commentCloseThreadLabel'})}
            </SpinningIconLabelButton>
          </div>
        </CardActions>
      )}
      {showActions && !thisCommentBeingEdited && (
        <CardActions>
          <div className={classes.actions}>
            {((resolved && showReopen) || (!resolved && showResolve)) && mobileLayout && (
              <SpinningIconLabelButton
                doSpin={(investibleId || resolved) && (resolved || commentType !== REPORT_TYPE)}
                onClick={resolved ? reopen : (commentType === REPORT_TYPE && investibleId ? () => navigate(history,
                  `${formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId,
                    REPORT_TYPE)}&resolveId=${id}`) : resolve)}
                icon={resolved ? SettingsBackupRestore : Done}
                id={`commentResolveReopenButton${id}`}
                iconOnly={!resolved}
              >
                {resolved && intl.formatMessage({ id: resolved ? 'commentReopenLabel' :
                    'commentResolveLabel' })}
              </SpinningIconLabelButton>
            )}
            {isSent !== false && enableEditing && !removeActions && (
              <SpinningIconLabelButton
                onClick={() => navigate(history, formWizardLink(REPLY_WIZARD_TYPE, marketId,
                  undefined, undefined, id, typeObjectId))}
                icon={showSubTask ? ListAltIcon : ReplyIcon}
                iconOnly={mobileLayout}
                id={`commentReplyButton${id}`}
                doSpin={false}
              >
                {!mobileLayout && intl.formatMessage({ id: showSubTask ? 'commentSubTaskLabel' : 'commentReplyLabel' })} {hasReply(comment) && <EditIcon />}
              </SpinningIconLabelButton>
            )}
            {enableEditing && !removeActions && commentType === TODO_TYPE && !investibleId && (
              <FormControl size='small'>
                <Select
                  value={myNotificationType}
                  onChange={onNotificationTypeChange}
                  onClick={(event) => event.stopPropagation()}
                  style={{backgroundColor: 'white', marginRight: '1rem', marginTop: '0.35rem'}}
                >
                  <MenuItem value='RED'>
                    {intl.formatMessage({ id: 'immediate' })}
                  </MenuItem>
                  <MenuItem value='YELLOW'>
                    {intl.formatMessage({ id: 'able' })}
                  </MenuItem>
                  <MenuItem value='BLUE'>
                    {intl.formatMessage({ id: 'convenient' })}
                  </MenuItem>
                </Select>
              </FormControl>
            )}
            {showAddVoting && (
              <SpinningIconLabelButton
                onClick={() => navigate(history, formWizardLink(JOB_COMMENT_CONFIGURE_WIZARD_TYPE, marketId,
                  undefined, undefined, id, typeObjectId))} iconOnly={mobileLayout}
                doSpin={false} icon={ThumbsUpDownIcon}>
                {!mobileLayout && intl.formatMessage({ id: 'addVoting' })}
              </SpinningIconLabelButton>
            )}
            {inlineMarket.market_type === DECISION_TYPE && enableEditing && !removeActions && (
              <SpinningIconLabelButton
                doSpin={false}
                onClick={() => navigate(history, formWizardLink(OPTION_WIZARD_TYPE, inlineMarketId,
                  undefined, undefined, undefined, typeObjectId))}
                icon={AddIcon}
                iconOnly={mobileLayout}
                id={`addOptionButton${id}`}
              >
                {!mobileLayout && intl.formatMessage({ id: 'inlineAddLabel' })}
              </SpinningIconLabelButton>
            )}
            {showAbstain && (
              <SpinningIconLabelButton
                onClick={() => abstain(true)}
                icon={NotInterested}
                iconOnly={mobileLayout}
                id={`commentAbstainButton${id}`}
              >
                {!mobileLayout && intl.formatMessage({ id: 'commentAbstainLabel' })}
              </SpinningIconLabelButton>
            )}
            {showUnmute && (
              <SpinningIconLabelButton
                onClick={() => abstain(false)}
                icon={NotificationsActive}
                iconOnly={mobileLayout}
                id={`commentUnmuteButton${id}`}
              >
                {!mobileLayout && intl.formatMessage({ id: 'commentUnmuteLabel' })}
              </SpinningIconLabelButton>
            )}
            {commentType === TODO_TYPE && investibleId && !removeActions && enableEditing && !inBacklog && (
              <FormControlLabel
                id='inProgressCheckbox'
                style={{maxHeight: '1rem', marginTop: mobileLayout ? '0.35rem' : '0.7rem'}}
                control={
                  <Checkbox
                    id={`inProgressCheckbox${id}`}
                    checked={operationRunning === `inProgressCheckbox${id}` ? !inProgress : inProgress}
                    onClick={handleToggleInProgress}
                    disabled={!myPresenceIsAssigned || removeActions || operationRunning !== false}
                  />
                }
                label={intl.formatMessage({ id: 'inProgress' })}
              />
            )}
            {showMoveButton && mobileLayout && (
              <SpinningIconLabelButton
                onClick={() => navigate(history,
                  `${formMarketAddInvestibleLink(marketId, groupId, undefined, typeObjectId,
                    investibleId && [TODO_TYPE, SUGGEST_CHANGE_TYPE].includes(commentType) ?
                      BUG_WIZARD_TYPE : undefined)}&fromCommentId=${id}`)}
                doSpin={false}
                iconOnly={true}
                icon={Eject}
              />
            )}
            {endActions}
          </div>
        </CardActions>
      )}
    </div>
  </div>
  let strippedBody = stripHTML(body);
  if (_.isEmpty(strippedBody)) {
    strippedBody = dateInfo;
  }
  const compressedCommentCard = <div style={{ display: 'flex', paddingBottom: '1rem', backgroundColor: 'white',
    height: '100%',
    cursor: 'pointer', width: 'fit-content', maxWidth: '98%', marginTop: isSent === false || usePadding === false ? 0
      : '1rem' }} onClick={toggleCompression}>
    {cardTypeDisplay}
    <div className={classes.compressedComment}>
      {strippedBody}</div>
    <div style={{ flexGrow: 1 }}/>
    <div style={{ marginRight: '1rem', marginTop: '0.5rem' }}>
      <TooltipIconButton
        icon={<ExpandMoreIcon />}
        size="small"
        noPadding
        translationId="rowExpandComment"
      />
    </div>
  </div>;
  if (useCompression && (compressAll || inboxMessageId !== id)) {
    const numInThread = _.size(comments.filter((aComment) => aComment.root_comment_id === id));
    return (
    <>
      {inboxMessageId !== id ? compressedCommentCard :
        (isLargeDisplay(body, 7) ? compressedCommentCard  : commentCard)}
      <LocalCommentsContext.Provider value={{ comments, marketId, idPrepend }}>
        {inboxMessageId === id && numInThread > 0 &&
          getCompressionButton(numInThread, id, toggleCompression, intl)
        }
        {inboxMessageId !== id && sortedReplies.map(child => {
          const parent = findParentInDescendants(child, inboxMessageId, comments);
          if (parent) {
            const numberHidden = calculateNumberHidden(comment, inboxMessageId, comments, parent);
            return (
              <>
                <div style={{marginBottom: numberHidden === 0 ? '15px' : undefined}} />
                <InitialReply
                  key={parent.id}
                  comment={parent}
                  marketId={marketId}
                  enableEditing={enableEditing}
                  replyEditId={replyEditId}
                  inboxMessageId={inboxMessageId}
                  useCompression
                  toggleCompression={toggleCompression}
                  numberHidden={numberHidden}
                  isInbox={isInbox}
                  myPresenceIsAssigned={myPresenceIsAssigned}
                  wizardProps={wizardProps}
                />
              </>
            );
          }
          return React.Fragment;
        })}
      </LocalCommentsContext.Provider>
      {getDecision(inlineMarketId)}
    </>
    );
  }
  const threadSize = calculateNumberHidden(comment, undefined, comments, undefined);
  return (
    <div style={{paddingLeft: usePadding && !beingEdited ? '0.5rem' : undefined, width: '98%'}}>
      {commentCard}
      {useCompression && threadSize > 0 && (
        <IconButton id={`removeCompressed${id}`} onClick={toggleCompression}
                    style={{border: '1px solid grey', marginTop: -7}}>
          <Tooltip key={`tipCompressed${id}`}
                   title={intl.formatMessage({ id: 'removeCompressionExplanation' })}>
            <StyledBadge
              badgeContent={threadSize}
              style={{paddingRight: '7px'}} >
              <UnfoldMore />
            </StyledBadge>
          </Tooltip>
        </IconButton>
      )}
      {!useCompression && (
        <Box marginTop={1} paddingX={1} className={classes.childWrapper}>
          <LocalCommentsContext.Provider value={{ comments, marketId, idPrepend }}>
            {sortedReplies.map(child => {
              const { id: childId } = child;
              return (
                <InitialReply
                  key={childId}
                  comment={child}
                  marketId={marketId}
                  enableEditing={enableEditing}
                  replyEditId={replyEditId}
                  inboxMessageId={inboxMessageId}
                  isInbox={isInbox}
                  myPresenceIsAssigned={myPresenceIsAssigned}
                  wizardProps={wizardProps}
                />
              );
            })}
          </LocalCommentsContext.Provider>
        </Box>
      )}
      {getDecision(inlineMarketId)}
    </div>
  );
}

Comment.propTypes = {
  comment: PropTypes.object.isRequired,
  noAuthor: PropTypes.bool,
  readOnly: PropTypes.bool,
  comments: PropTypes.arrayOf(PropTypes.object).isRequired,
  marketId: PropTypes.string.isRequired
};

Comment.defaultProps = {
  noAuthor: false,
  readOnly: false
};

const unknownPresence = {
  name: "unknown",
  email: ""
};

function useCommenter(comment, presences) {
  return presences.find(presence => presence.id === comment.created_by);
}

function useUpdatedBy(comment, presences) {
  return presences.find(presence => presence.id === comment.updated_by);
}

export default Comment;
