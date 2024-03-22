import React, { useContext, useEffect, useRef } from 'react';
import { FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Badge,
  Box,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  FormControlLabel,
  IconButton,
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
import { removeComment, reopenComment, resolveComment, updateComment } from '../../api/comments';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { changeMyPresence, usePresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import CommentEdit from './CommentEdit';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket, marketTokenLoaded } from '../../contexts/MarketsContext/marketsContextHelper';
import CardType, { BUG, DECISION_TYPE } from '../CardType';
import {
  addCommentToMarket,
  addMarketComments,
  getMarketComments
} from '../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import {
  ACTIVE_STAGE,
  BUG_WIZARD_TYPE,
  INITIATIVE_TYPE,
  JOB_COMMENT_CONFIGURE_WIZARD_TYPE,
  OPTION_WIZARD_TYPE,
  PLANNING_TYPE, REPLY_WIZARD_TYPE
} from '../../constants/markets';
import { red } from '@material-ui/core/colors';
import UsefulRelativeTime from '../TextFields/UseRelativeTime';
import { addInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getInReviewStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import {
  decomposeMarketPath,
  formCommentLink,
  formMarketAddInvestibleLink,
  formWizardLink,
  navigate,
  preventDefaultAndProp
} from '../../utils/marketIdPathFunctions';
import { useHistory, useLocation } from 'react-router';
import { marketAbstain } from '../../api/markets';
import {
  changeInvestibleStageOnCommentOpen,
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
  ExpandLess, NotificationsActive,
  NotInterested,
  SettingsBackupRestore,
  UnfoldMore
} from '@material-ui/icons';
import ReplyIcon from '@material-ui/icons/Reply';
import TooltipIconButton from '../Buttons/TooltipIconButton';
import { getPageReducerPage, usePageStateReducer } from '../PageState/pageStateHooks';
import InlineInitiativeBox from '../../containers/CommentBox/InlineInitiativeBox';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { getDiff, markDiffViewed } from '../../contexts/DiffContext/diffContextHelper';
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
import ListAltIcon from '@material-ui/icons/ListAlt';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import SettingsIcon from '@material-ui/icons/Settings';
import Options from './Options';
import Reply from './Reply';
import { stripHTML } from '../../utils/stringFunctions';
import Gravatar from '../Avatars/Gravatar';
import styled from 'styled-components';
import { NOT_FULLY_VOTED_TYPE, RED_LEVEL } from '../../constants/notifications';
import NotificationDeletion from '../../pages/Home/YourWork/NotificationDeletion';
import { quickNotificationChanges } from './CommentAdd';
import LightbulbOutlined from '../CustomChip/LightbulbOutlined';
import { getInboxTarget } from '../../contexts/NotificationsContext/notificationsContextHelper';

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
        padding: "0 20px"
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
        paddingRight: '50px',
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

function InitialReply(props) {
  const { comment, enableEditing, replyEditId, inboxMessageId, isInbox, wizardProps,
    numberHidden = 0, useCompression, toggleCompression } = props;
  const intl = useIntl();
  if (numberHidden > 0) {
    return (
      <>
        <IconButton id={`removeCompressed${inboxMessageId}`} onClick={toggleCompression}
                    style={{border: '1px solid grey', marginTop: -11, marginBottom: -11}}>
          <Tooltip key={`tipCompressed${inboxMessageId}`}
                   title={intl.formatMessage({ id: 'removeCompressionExplanation' })}>
            <StyledBadge badgeContent={numberHidden} style={{paddingRight: '7px'}} >
              <UnfoldMore />
            </StyledBadge>
          </Tooltip>
        </IconButton>
        <Reply comment={comment} enableEditing={enableEditing} replyEditId={replyEditId}
               useCompression={useCompression} toggleCompression={toggleCompression}
               inboxMessageId={inboxMessageId} isInbox={isInbox} wizardProps={wizardProps}/>
      </>
    );
  }
  return <Reply comment={comment} enableEditing={enableEditing} replyEditId={replyEditId}
                useCompression={useCompression} toggleCompression={toggleCompression}
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
  const notifiedParentId = notifiedComment.reply_id;
  if (notifiedParentId === notifiedComment.root_comment_id) {
    if (useComment.id === inboxMessageId) {
      // If this is a reply to the root then return it
      return notifiedComment;
    }
    return undefined;
  }
  const notifiedParent = comments.find((comment) => comment.id === notifiedParentId);
  let found = false;
  let commentPointer = notifiedParent;
  while(commentPointer.reply_id) {
    if (useComment.id === commentPointer.id) {
      found = true;
      break;
    }
    // eslint-disable-next-line no-loop-func
    commentPointer = comments.find((comment) => comment.id === commentPointer.reply_id);
  }
  return found ? notifiedParent : undefined;
}

/**
 * A question or issue
 * @param {{comment: Comment, comments: Comment[]}} props
 */
function Comment(props) {
  const { comment, marketId, comments, noAuthor, defaultShowDiff, isReply, wizardProps,
    resolvedStageId, stagePreventsActions, isInbox, replyEditId, currentStageId, marketInfo, investible, removeActions,
    inboxMessageId, toggleCompression: toggleCompressionRaw, useCompression, showVoting, selectedInvestibleIdParent,
    isMove, idPrepend='c' } = props;
  const history = useHistory();
  const location = useLocation();
  const editBox = useRef(null);
  const theme = useTheme();
  const isReallyMobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const intl = useIntl();
  const classes = useCommentStyles();
  const { id, comment_type: commentType, investible_id: investibleId, inline_market_id: inlineMarketId,
    resolved, notification_type: myNotificationType, body, is_sent: isSent, group_id: groupId,
    in_progress: inProgress } = comment;
  const { pathname } = location;
  const { marketId: typeObjectIdRaw, action } = decomposeMarketPath(pathname);
  const typeObjectId = action === 'inbox' ? typeObjectIdRaw : undefined;
  const replyBeingEdited = replyEditId === id && isReply;
  const beingEdited = replyEditId === id && !replyBeingEdited;
  const presences = usePresences(marketId);
  const inlinePresences = usePresences(inlineMarketId);
  const createdBy = useCommenter(comment, presences) || unknownPresence;
  const updatedBy = useUpdatedBy(comment, presences) || unknownPresence;
  const [marketsState, , tokensHash] = useContext(MarketsContext);
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
  const sortedReplies = _.sortBy(replies, "created_at");
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState, presenceDispatch] = useContext(MarketPresencesContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [diffState, diffDispatch] = useContext(DiffContext);
  const [searchResults] = useContext(SearchResultsContext);
  const [userState] = useContext(AccountContext);
  const [hashFragment, noHighlightId, setNoHighlightId] = useContext(ScrollContext);
  const hasUser = userIsLoaded(userState);
  const enableActions = !inArchives && !stagePreventsActions;
  const enableEditing = enableActions && !resolved; //resolved comments or those in archive aren't editable
  const [editStateFull, editDispatch] = usePageStateReducer('commentEdit');
  const [editState, updateEditState, editStateReset] = getPageReducerPage(editStateFull, editDispatch, id);
  const {
    showDiff: storedShowDiff
  } = editState;
  const showDiff = storedShowDiff || (storedShowDiff === undefined && defaultShowDiff);
  const myMessage = findMessageForCommentId(id, messagesState);
  const inReviewStage = getInReviewStage(marketStagesState, marketId) || {};
  const inReviewStageId = inReviewStage.id;
  const createdInReview = currentStageId === inReviewStageId;
  const loading = !hasUser || !myPresence || !marketType || !marketTokenLoaded(marketId, tokensHash)
    || (inlineMarketId && _.isEmpty(inlineMarket));
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
    if (showDiff) {
      markDiffViewed(diffDispatch, id);
    }
    updateEditState({showDiff: !showDiff});
  }

  function toggleEdit() {
    if (replyEditId) {
      navigate(history, formCommentLink(marketId, groupId, investibleId, id));
      setNoHighlightId(id);
    } else {
      navigate(history, `/comment/${marketId}/${id}#c${id}`, false, true);
    }
  }

  function setBeingEdited(value, event) {
    if (isReallyMobileLayout || invalidEditEvent(event, history)) {
      return;
    }
    toggleEdit();
  }

  const isMarketTodo = marketType === PLANNING_TYPE && commentType === TODO_TYPE && !investibleId && !isMove;
  const isTask = marketType === PLANNING_TYPE && commentType === TODO_TYPE && investibleId;
  const isEditable = comment.created_by === myPresence.id || isMarketTodo || (isTask && myPresenceIsAssigned);

  function getDialog(anInlineMarket) {
    return (
      <Options anInlineMarket={anInlineMarket} marketId={marketId} investibleId={investibleId} inArchives={inArchives}
               isEditable={isEditable} isSent={isSent} groupId={groupId} removeActions={removeActions} isInbox={isInbox}
               selectedInvestibleIdParent={selectedInvestibleIdParent} searchResults={searchResults} />
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
      return <InlineInitiativeBox anInlineMarket={anInlineMarket} removeActions={removeActions}
                                  isTaskDisplay={commentType === TODO_TYPE} typeObjectId={typeObjectId}
                                  inArchives={marketStage !== ACTIVE_STAGE || inArchives || resolved} />;
    }
    return getDialog(anInlineMarket);
  }

  function reopen() {
    return reopenComment(marketId, id)
      .then((comment) => {
        onCommentOpen(investiblesState, investibleId, marketStagesState, marketId, comment, investiblesDispatch,
          commentsState, commentsDispatch, myPresence);
        // The only message that will be there is the one telling you the comment was resolved
        removeMessagesForCommentId(id, messagesState);
        setOperationRunning(false);
      });
  }
  function remove() {
    setOperationRunning(true);
    return removeComment(marketId, id)
      .then((comment) => {
        addMarketComments(commentsDispatch, marketId, [comment]);
        removeMessagesForCommentId(id, messagesState);
        setOperationRunning(false);
        if (isInbox) {
          navigate(history, getInboxTarget());
        }
      });
  }

  function abstain(abstain) {
    setOperationRunning(true);
    return marketAbstain(inlineMarketId, abstain)
      .then(() => {
        const newValues = {
          abstain,
        }
        changeMyPresence(marketPresencesState, presenceDispatch, marketId, newValues)
        removeMessagesForCommentId(id, messagesState)
        setOperationRunning(false);
        if (isInbox) {
          navigate(history, getInboxTarget());
        }
      });
  }

  function myAccept() {
    setOperationRunning(true);
    return updateComment({marketId, commentId: id, commentType: TODO_TYPE}).then((comment) => {
      handleAcceptSuggestion({ isMove: myPresenceIsAssigned && myPresence === createdBy &&
          isSingleAssisted(comments, assigned), comment, investible, investiblesDispatch, marketStagesState,
        commentsState, commentsDispatch, messagesState })
      setOperationRunning(false);
      navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id, id));
    })
  }

  function myMoveToSuggestion() {
    setOperationRunning(true);
    return updateComment({marketId, commentId: id, commentType: SUGGEST_CHANGE_TYPE}).then((comment) => {
      const withNewComment = _.concat(comments, comment);
      addCommentToMarket(comment, commentsState, commentsDispatch);
      if (myPresenceIsAssigned && myPresence === createdBy && isSingleAssisted(withNewComment, assigned)) {
        changeInvestibleStageOnCommentOpen(false, true, marketStagesState,
          [marketInfo], investible, investiblesDispatch, comment, myPresence);
        quickNotificationChanges(comment.comment_type, comment.investible_id, messagesState, messagesDispatch,
          [], comment, undefined, commentsState, commentsDispatch, comment.market_id, myPresence);
      }
      setOperationRunning(false);
      navigate(history, formCommentLink(marketId, comment.group_id, comment.investible_id, id));
    })
  }

  function resolve() {
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
    return updateComment({marketId, commentId: id, inProgress: !inProgress}).then((comment) => {
      setOperationRunning(false);
      addCommentToMarket(comment, commentsState, commentsDispatch);
    });
  }

  const diff = getDiff(diffState, id);
  const { level: myHighlightedLevel, is_highlighted: isHighlighted } = myMessage || {};
  const overrideLabel = isMarketTodo ? <FormattedMessage id="notificationLabel" /> : undefined;
  const color = isMarketTodo ? myNotificationType : undefined;
  const displayUpdatedBy = updatedBy !== undefined && comment.updated_by !== comment.created_by;
  const showActions = !replyBeingEdited || replies.length > 0;
  function getCommentHighlightStyle() {
    if (isInbox) {
      if (!inboxMessageId || inboxMessageId === id) {
        return classes.containerBlueLink;
      }
      return classes.containerLink;
    }
    if (myHighlightedLevel && isHighlighted) {
      if (myHighlightedLevel === "YELLOW" || myHighlightedLevel === "BLUE") {
        return classes.containerYellow;
      }
      return classes.containerRed;
    }
    if (noHighlightId !== id && hashFragment?.includes(id)) {
      return classes.containerYellow;
    }
    return classes.container;
  }

  const displayingDiff = myMessage && showDiff && diff;
  const displayEditing = enableEditing && isEditable;
  if (loading) {
    return (
      <div className={classes.container}>
        <LoadingDisplay showMessage messageId="commentLoadingMessage" noMargin/>
      </div>
    )
  }

  const showAcceptReject =  investibleId && !resolved && marketType === PLANNING_TYPE && !removeActions;
  const showMoveButton = isSent !== false
    && [TODO_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE].includes(commentType)
    && !inArchives && !removeActions && enableActions && marketType === PLANNING_TYPE;
  const showConfigureVotingButton = commentType === QUESTION_TYPE && !inArchives && inlineMarketId && !resolved
    && !removeActions && myPresence === createdBy;
  const showResolve = isSent !== false && enableActions && !resolved && !removeActions;
  const showReopen = resolved && !removeActions && enableActions && commentType !== REPORT_TYPE;
  const showAddVoting = commentType === SUGGEST_CHANGE_TYPE && !inArchives && !resolved && !inlineMarketId
    && marketType === PLANNING_TYPE && !removeActions;
  const yourVote = myInlinePresence && myInlinePresence.investments &&
    myInlinePresence.investments.find((investment) => !investment.deleted);
  const showAbstain = enableActions && inlineMarketId && myPresence !== createdBy && !resolved &&
    !myInlinePresence.abstain && !yourVote && !removeActions && myMessage?.type === NOT_FULLY_VOTED_TYPE;
  const showUnmute = !removeActions && myInlinePresence.abstain && !resolved && enableActions;
  const isDeletable = !isInbox && (commentType === REPORT_TYPE || isEditable || resolved);
  const gravatarWithName = useCompression && inboxMessageId ?
    <Gravatar name={createdBy.name} email={createdBy.email} className={classes.smallGravatar}/>
    : <GravatarAndName key={myPresence.id} email={createdBy.email}
                                            name={createdBy.name} typographyVariant="caption"
                                            typographyClassName={classes.createdBy}
                                            avatarClassName={classes.smallGravatar}
  />;
  const cardTypeDisplay = overrideLabel ? (
    <CardType className={classes.commentType} type={commentType} resolved={resolved} compact
              subtype={commentType === TODO_TYPE && _.isEmpty(investibleId) ? BUG : undefined}
              label={overrideLabel} color={color} compressed={useCompression}
              gravatar={noAuthor || mobileLayout ? undefined : gravatarWithName}
    />
  ): (
    <CardType className={classes.commentType} type={commentType} resolved={resolved} compact compressed={useCompression}
              gravatar={noAuthor || mobileLayout ? undefined : gravatarWithName}
    />
  );
  if (useCompression && inboxMessageId && inboxMessageId !== id) {
    return (
    <>
      <Card elevation={3} style={{ display: 'flex', paddingBottom: '1rem', cursor: 'pointer' }}
            onClick={toggleCompression}>
        {cardTypeDisplay}
        <div className={classes.compressedComment}>
          {stripHTML(body)}</div>
        <div style={{ flexGrow: 1 }}/>
        <ExpandMoreIcon style={{ color: 'black', marginRight: '1rem', marginTop: '0.5rem' }}/>
      </Card>
      <LocalCommentsContext.Provider value={{ comments, marketId, idPrepend }}>
        {sortedReplies.map(child => {
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
                  wizardProps={wizardProps}
                />
              </>
            );
          }
          return React.Fragment;
        })}
      </LocalCommentsContext.Provider>
    </>
    );
  }
  const threadSize = calculateNumberHidden(comment, undefined, comments, undefined);
  return (
    <div style={{paddingLeft: '0.5rem', width: '98%'}}>
      <Card elevation={3} style={{overflow: 'unset', marginTop: isSent === false ? 0 : undefined}}
            className={getCommentHighlightStyle()}
            ref={editBox}
      >
        <div onClick={(event) => {
          if (isInbox && !invalidEditEvent(event, history)) {
            navigate(history, formCommentLink(marketId, groupId, investibleId, id));
          }
        }}>
          <Box display="flex">
            {cardTypeDisplay}
            <div style={{flexGrow: 1}}/>
            {commentType !== JUSTIFY_TYPE && commentType !== REPLY_TYPE && (
              <>
                {mobileLayout && (
                  <Typography className={classes.timeElapsed} variant="body2">
                    {intl.formatDate(comment.updated_at)}
                  </Typography>
                )}
                {!mobileLayout && (
                  <Typography className={classes.timeElapsed} variant="body2" style={{paddingLeft: '0.25rem'}}>
                    Created <UsefulRelativeTime value={comment.created_at}/>
                    {noAuthor &&
                    `${intl.formatMessage({ id: 'lastUpdatedBy' })} ${createdBy.name}`}.
                    {comment.created_at < comment.updated_at && !resolved && (
                      <> Updated <UsefulRelativeTime value={comment.updated_at}/></>
                    )}
                    {resolved && (
                      <> Resolved <UsefulRelativeTime value={comment.updated_at}/></>
                    )}
                    {comment.created_at < comment.updated_at && !displayUpdatedBy && (
                      <>.</>
                    )}
                    {displayUpdatedBy &&
                    `${intl.formatMessage({ id: 'lastUpdatedBy' })} ${updatedBy.name}.`}
                  </Typography>
                )}
              </>
            )}
            {displayEditing && isReallyMobileLayout && !beingEdited && (
              <TooltipIconButton
                onClick={toggleEdit}
                icon={<Edit fontSize='small' style={{marginRight: '1rem'}} />}
                translationId="edit"
              />
            )}
            {!mobileLayout && !isInbox && ![JUSTIFY_TYPE, REPLY_TYPE].includes(commentType)
              && marketType !== DECISION_TYPE && (
              <div style={{marginRight: '2rem', marginTop: '-0.25rem'}}>
                <InvesibleCommentLinker commentId={id} investibleId={investibleId} marketId={marketId} />
              </div>
            )}
            {(myPresence.is_admin || isEditable) && enableActions && isDeletable && (
              <div style={{marginRight: '2rem'}}>
                <TooltipIconButton
                  disabled={operationRunning !== false}
                  onClick={remove}
                  icon={<NotificationDeletion isRed={operationRunning === false} />}
                  size={mobileLayout ? 'small' : undefined}
                  translationId="commentRemoveLabel"
                />
              </div>
            )}
          </Box>
          <CardContent className={classes.cardContent}>
            {!noAuthor && mobileLayout && (
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
              {!beingEdited && !displayingDiff && !_.isEmpty(comment) && (
                <ReadOnlyQuillEditor value={body} setBeingEdited={setBeingEdited}
                                     noOverflow={isInbox}
                                     id={isInbox ? `inboxComment${id}` : id}
                                     isEditable={!isReallyMobileLayout && displayEditing}/>
              )}
              {!beingEdited && displayingDiff && (
                <DiffDisplay id={id} />
              )}
              {beingEdited && (
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
          {showActions && !beingEdited && (
            <CardActions>
              <div className={classes.actions}>
                {useCompression === false && (
                  <SpinningIconLabelButton
                    icon={ExpandLess}
                    doSpin={false}
                    onClick={(event) => {
                      preventDefaultAndProp(event);
                      toggleCompression();
                    }}
                  >
                    <FormattedMessage
                      id="commentCloseThreadLabel"
                    />
                  </SpinningIconLabelButton>
                )}
                {showAddVoting && (
                  <SpinningIconLabelButton
                    onClick={() => navigate(history, formWizardLink(JOB_COMMENT_CONFIGURE_WIZARD_TYPE, marketId,
                      undefined, undefined, id, typeObjectId))} iconOnly={mobileLayout}
                                           doSpin={false} icon={ThumbsUpDownIcon}>
                    {!mobileLayout && intl.formatMessage({ id: 'addVoting' })}
                  </SpinningIconLabelButton>
                )}
                {showAcceptReject && commentType === SUGGEST_CHANGE_TYPE && (
                  <SpinningIconLabelButton onClick={myAccept} icon={ListAltIcon} iconOnly={mobileLayout}
                                           id={`convertToTask${id}`}>
                    {!mobileLayout && intl.formatMessage({ id: 'wizardAcceptLabel' })}
                  </SpinningIconLabelButton>
                )}
                {((resolved && showReopen) || (!resolved && showResolve)) && (
                  <SpinningIconLabelButton
                    onClick={resolved ? reopen : resolve}
                    icon={resolved ? SettingsBackupRestore : Done}
                    id={`commentResolveReopenButton${id}`}
                    iconOnly={mobileLayout && !resolved}
                  >
                    {(!mobileLayout || resolved) && intl.formatMessage({
                      id: resolved ? 'commentReopenLabel' : 'commentResolveLabel'
                    })}
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
                {isSent !== false && enableEditing && !removeActions && (
                  <SpinningIconLabelButton
                    onClick={() => navigate(history, formWizardLink(REPLY_WIZARD_TYPE, marketId,
                      undefined, undefined, id, typeObjectId))}
                    icon={ReplyIcon}
                    iconOnly={mobileLayout}
                    id={`commentReplyButton${id}`}
                    doSpin={false}
                  >
                    {!mobileLayout && intl.formatMessage({ id: "commentReplyLabel" })}
                  </SpinningIconLabelButton>
                )}
                {commentType === TODO_TYPE && investibleId && !removeActions && enableEditing && (
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
                    label={mobileLayout ? undefined : intl.formatMessage({ id: 'inProgress' })}
                  />
                )}
                {showMoveButton && mobileLayout && (
                  <SpinningIconLabelButton
                    onClick={() => navigate(history,
                      `${formMarketAddInvestibleLink(marketId, groupId, undefined, typeObjectId,
                        investibleId && commentType === TODO_TYPE ? BUG_WIZARD_TYPE 
                          : undefined)}&fromCommentId=${id}`)}
                    doSpin={false}
                    iconOnly={true}
                    icon={Eject}
                  />
                )}
              </div>
              <div className={mobileLayout ? classes.actions : classes.actionsEnd}>
                {showConfigureVotingButton && (
                  <SpinningIconLabelButton
                    onClick={() => navigate(history, formWizardLink(JOB_COMMENT_CONFIGURE_WIZARD_TYPE, marketId,
                      undefined, undefined, id, typeObjectId))}
                    doSpin={false} icon={SettingsIcon} iconOnly={mobileLayout}>
                    {!mobileLayout && intl.formatMessage({ id: 'configureVoting' })}
                  </SpinningIconLabelButton>
                )}
                {showAcceptReject && commentType === TODO_TYPE && (
                  <SpinningIconLabelButton onClick={myMoveToSuggestion} icon={LightbulbOutlined} iconOnly={mobileLayout}
                                           id={`convertToSuggestion${id}`}>
                    {!mobileLayout && intl.formatMessage({ id: 'moveToSuggestion' })}
                  </SpinningIconLabelButton>
                )}
                {showMoveButton && !mobileLayout && (
                  <SpinningIconLabelButton
                    onClick={() => navigate(history,
                      `${formMarketAddInvestibleLink(marketId, groupId, undefined, typeObjectId,
                        investibleId && commentType === TODO_TYPE ? BUG_WIZARD_TYPE
                          : undefined)}&fromCommentId=${id}`)}
                    doSpin={false}
                    icon={Eject}
                  >
                    {intl.formatMessage({ id: "storyFromComment" })}
                  </SpinningIconLabelButton>
                )}
                {myMessage && diff && !mobileLayout && (
                  <SpinningIconLabelButton icon={showDiff ? ExpandLess : ExpandMoreIcon}
                                           onClick={(event) => toggleDiffShow(event)}
                                           doSpin={false}>
                    <FormattedMessage id={showDiff ? 'diffDisplayDismissLabel' : 'diffDisplayShowLabel'} />
                  </SpinningIconLabelButton>
                )}
              </div>
            </CardActions>
          )}
        </div>
      </Card>
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
