import React, { useContext, useEffect } from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Grid,
  Typography,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import _ from 'lodash';
import ReadOnlyQuillEditor from '../TextEditors/ReadOnlyQuillEditor';
import CommentAdd from './CommentAdd';
import {
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
import {
  changeMyPresence,
  getMarketPresences,
  usePresences
} from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import CommentEdit from './CommentEdit';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket, getMyUserForMarket, marketTokenLoaded } from '../../contexts/MarketsContext/marketsContextHelper';
import CardType, { BUG, DECISION_TYPE, IN_REVIEW } from '../CardType';
import { SECTION_TYPE_SECONDARY_WARNING } from '../../constants/global';
import {
  addCommentToMarket,
  getMarketComments,
  removeComments
} from '../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import {
  ACTIVE_STAGE,
  INITIATIVE_TYPE,
  JOB_COMMENT_CONFIGURE_WIZARD_TYPE, OPTION_WIZARD_TYPE,
  PLANNING_TYPE
} from '../../constants/markets';
import { red } from '@material-ui/core/colors';
import UsefulRelativeTime from '../TextFields/UseRelativeTime';
import { addInvestible, getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import SubSection from '../../containers/SubSection/SubSection';
import CurrentVoting from '../../pages/Dialog/Decision/CurrentVoting';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import ProposedIdeas from '../../pages/Dialog/Decision/ProposedIdeas';
import {
  getInCurrentVotingStage,
  getInReviewStage,
  getProposedOptionsStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import {
  formCommentEditReplyLink,
  formCommentLink,
  formMarketAddInvestibleLink,
  formWizardLink,
  navigate
} from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { marketAbstain } from '../../api/markets';
import { changeInvestibleStageOnCommentClose, onCommentOpen } from '../../utils/commentFunctions';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import {
  findMessageForCommentId,
  findMessagesForCommentId,
  findMessagesForInvestibleId,
  removeMessagesForCommentId
} from '../../utils/messageUtils';
import GravatarAndName from '../Avatars/GravatarAndName';
import { invalidEditEvent } from '../../utils/windowUtils';
import AddIcon from '@material-ui/icons/Add';
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton';
import { Clear, Delete, Done, Edit, Eject, ExpandLess, NotInterested, SettingsBackupRestore } from '@material-ui/icons';
import ReplyIcon from '@material-ui/icons/Reply';
import TooltipIconButton from '../Buttons/TooltipIconButton';
import { getPageReducerPage, usePageStateReducer } from '../PageState/pageStateHooks';
import InlineInitiativeBox from '../../containers/CommentBox/InlineInitiativeBox';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import { getDiff, markDiffViewed } from '../../contexts/DiffContext/diffContextHelper';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import DiffDisplay from '../TextEditors/DiffDisplay';
import { workListStyles } from '../../pages/Home/YourWork/WorkListItem';
import LoadingDisplay from '../LoadingDisplay';
import { pushMessage } from '../../utils/MessageBusUtils';
import { GUEST_MARKET_EVENT, LOAD_MARKET_CHANNEL } from '../../contexts/MarketsContext/marketsContextMessages';
import { SearchResultsContext } from '../../contexts/SearchResultsContext/SearchResultsContext';
import GravatarGroup from '../Avatars/GravatarGroup';
import { getInboxTarget } from '../../contexts/NotificationsContext/notificationsContextHelper';
import { userIsLoaded } from '../../contexts/AccountContext/accountUserContextHelper';
import InvesibleCommentLinker from '../../pages/Dialog/InvesibleCommentLinker';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { removeMessages } from '../../contexts/NotificationsContext/notificationsContextReducer';
import { ScrollContext } from '../../contexts/ScrollContext';
import ListAltIcon from '@material-ui/icons/ListAlt';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import SettingsIcon from '@material-ui/icons/Settings';

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
        marginTop: "1.5rem"
      },
      containerYellow: {
        boxShadow: "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px yellow",
        overflow: "visible",
        marginTop: "1.5rem"
      },
      containerBlueLink: {
        boxShadow: "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px blue",
        overflow: "visible",
        marginTop: "1.5rem",
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
  }
},
{ name: "Comment" }
);

/**
 * @type {React.Context<{comments: Comment[], marketId: string}>}
 */
const LocalCommentsContext = React.createContext(null);
function useComments() {
  return React.useContext(LocalCommentsContext).comments;
}
function useMarketId() {
  return React.useContext(LocalCommentsContext).marketId;
}
function navigateEditReplyBack(history, id, marketId, groupId, investibleId, replyEditId, isReply=false,
  isFromInbox, setNoHighlightId) {
  if (replyEditId) {
    const path = isFromInbox ? getInboxTarget() : formCommentLink(marketId, groupId, investibleId, id);
    navigate(history, path);
    setNoHighlightId(id);
  } else {
    navigate(history, formCommentEditReplyLink(marketId, id, isReply), false, true);
  }
}

/**
 * A question or issue
 * @param {{comment: Comment, comments: Comment[]}} props
 */
function Comment(props) {
  const { comment, marketId, comments, noAuthor, onDone, defaultShowDiff, showDone,
    resolvedStageId, stagePreventsActions, isInbox, replyEditId, currentStageId, marketInfo, investible, removeActions,
    inboxMessageId, showVoting, selectedInvestibleIdParent, setSelectedInvestibleIdParent } = props;
  const history = useHistory();
  const myParams = new URL(document.location).searchParams;
  const theme = useTheme();
  const isReallyMobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const mobileLayout = useMediaQuery(theme.breakpoints.down('md'));
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, investibleDispatch] = useContext(InvestiblesContext);
  const intl = useIntl();
  const classes = useCommentStyles();
  const workItemClasses = workListStyles();
  const { id, comment_type: commentType, investible_id: investibleId, inline_market_id: inlineMarketId,
    resolved, notification_type: myNotificationType, mentions, body, creator_assigned: creatorAssigned, is_sent: isSent,
    group_id: groupId } = comment;
  const replyBeingEdited = replyEditId === id && myParams && !_.isEmpty(myParams.get('reply'));
  const beingEdited = replyEditId === id && !replyBeingEdited;
  const isFromInbox = myParams && !_.isEmpty(myParams.get('inbox'));
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
  const [replyAddStateFull, replyAddDispatch] = usePageStateReducer('replyAdd');
  const [replyAddState, updateReplyAddState, replyAddStateReset] =
    getPageReducerPage(replyAddStateFull, replyAddDispatch, id);
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

  function toggleDiffShow() {
    if (showDiff) {
      markDiffViewed(diffDispatch, id);
    }
    updateEditState({showDiff: !showDiff});
  }

  function toggleBase(isReply) {
    navigateEditReplyBack(history, id, marketId, groupId, investibleId, replyEditId, isReply, isFromInbox,
      setNoHighlightId);
  }

  function toggleReply() {
    toggleBase(true);
  }

  function toggleEdit() {
    toggleBase(false);
  }

  function setBeingEdited(value, event) {
    if (isReallyMobileLayout || invalidEditEvent(event, history)) {
      return;
    }
    toggleEdit();
  }

  function getInlineInvestiblesForStage(stage, inlineInvestibles) {
    if (stage) {
      return inlineInvestibles.reduce((acc, inv) => {
        const { market_infos: marketInfos } = inv;
        for (let x = 0; x < marketInfos.length; x += 1) {
          if (marketInfos[x].stage === stage.id && !marketInfos[x].deleted) {
            return [...acc, inv]
          }
        }
        return acc;
      }, []);
    }
    return [];
  }

  const isMarketTodo = marketType === PLANNING_TYPE && commentType === TODO_TYPE && !investibleId;
  const isTask = marketType === PLANNING_TYPE && commentType === TODO_TYPE && investibleId;
  const isEditable = comment.created_by === myPresence.id || isMarketTodo || (isTask && myPresenceIsAssigned);

  function getDialog(anInlineMarket) {
    const inlineInvestibles = getMarketInvestibles(investiblesState, anInlineMarket.id, searchResults) || [];
    const anInlineMarketInvestibleComments = getMarketComments(commentsState, anInlineMarket.id) || [];
    const anInlineMarketPresences = getMarketPresences(marketPresencesState, anInlineMarket.id) || [];
    const underConsiderationStage = getInCurrentVotingStage(marketStagesState, anInlineMarket.id);
    const underConsideration = getInlineInvestiblesForStage(underConsiderationStage, inlineInvestibles);
    const proposedStage = getProposedOptionsStage(marketStagesState, anInlineMarket.id);
    const proposed = getInlineInvestiblesForStage(proposedStage, inlineInvestibles);
    const abstaining = anInlineMarketPresences.filter((presence) => presence.abstain);
    const abstained = _.isEmpty(abstaining) ? undefined :
      <div style={{display: 'flex', paddingLeft: '2rem', alignItems: 'center'}}>
      <Typography variant='body2' style={{paddingRight: '0.5rem'}}>
        {intl.formatMessage({ id: 'commentAbstainingLabel' })}</Typography>
      <GravatarGroup users={abstaining}/>
    </div>;
    return (
      <>
        <Grid item xs={12} style={{marginTop: '1rem'}}>
          <SubSection
            id={`${isInbox ? 'inbox' : ''}currentVoting`}
            type={SECTION_TYPE_SECONDARY_WARNING}
            bolder
            title={intl.formatMessage({ id: 'decisionDialogCurrentVotingLabel' })}
            supportingInformation={abstained}
          >
            <CurrentVoting
              marketPresences={anInlineMarketPresences}
              investibles={underConsideration}
              marketId={anInlineMarket.id}
              parentMarketId={marketId}
              parentInvestibleId={investibleId}
              groupId={groupId}
              comments={anInlineMarketInvestibleComments}
              inArchives={inArchives}
              isAdmin={isEditable}
              isSent={isSent}
              removeActions={removeActions}
              selectedInvestibleIdParent={selectedInvestibleIdParent}
              setSelectedInvestibleIdParent={setSelectedInvestibleIdParent}
            />
          </SubSection>
        </Grid>
        <Grid item xs={12} style={{marginTop: '1rem'}}>
          <SubSection
            id="proposedVoting"
            type={SECTION_TYPE_SECONDARY_WARNING}
            bolder
            title={intl.formatMessage({ id: 'decisionDialogProposedOptionsLabel' })}
          >
            <ProposedIdeas
              marketPresences={anInlineMarketPresences}
              investibles={proposed}
              marketId={anInlineMarket.id}
              comments={anInlineMarketInvestibleComments}
              isAdmin={isEditable}
              inArchives={inArchives}
              isSent={isSent}
              removeActions={removeActions}
              selectedInvestibleIdParent={selectedInvestibleIdParent}
              setSelectedInvestibleIdParent={setSelectedInvestibleIdParent}
            />
          </SubSection>
        </Grid>
      </>
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
      return <InlineInitiativeBox anInlineMarket={anInlineMarket}
                                  showAcceptReject={showAcceptReject || commentType !== SUGGEST_CHANGE_TYPE}
                                  inArchives={marketStage !== ACTIVE_STAGE || inArchives || resolved} />;
    }
    return getDialog(anInlineMarket);
  }

  function reopen() {
    return reopenComment(marketId, id)
      .then((comment) => {
        onCommentOpen(investiblesState, investibleId, marketStagesState, marketId, comment, investiblesDispatch,
          commentsState, commentsDispatch);
        // The only message that will be there is the one telling you the comment was resolved
        removeMessagesForCommentId(id, messagesState, workItemClasses.removed);
        setOperationRunning(false);
        onDone();
      });
  }
  function remove() {
    setOperationRunning(true);
    return removeComment(marketId, id)
      .then(() => {
        removeComments(commentsDispatch, marketId, [id]);
        removeMessagesForCommentId(id, messagesState, workItemClasses.removed);
        setOperationRunning(false);
        onDone();
      });
  }

  function abstain() {
    setOperationRunning(true);
    return marketAbstain(inlineMarketId)
      .then(() => {
        const newValues = {
          abstain: true,
        }
        changeMyPresence(marketPresencesState, presenceDispatch, marketId, newValues)
        removeMessagesForCommentId(id, messagesState, workItemClasses.removed)
        setOperationRunning(false)
        onDone()
      });
  }

  function myAccept () {
    setOperationRunning(true)
    return updateComment(marketId, id, undefined, TODO_TYPE).then((comment) => {
      if (myPresence === createdBy) {
        changeInvestibleStageOnCommentClose([marketInfo], investible, investibleDispatch,
          comment, marketStagesState);
      }
      addCommentToMarket(comment, commentsState, commentsDispatch);
      removeMessagesForCommentId(id, messagesState, workItemClasses.removed);
      setOperationRunning(false);
    })
  }

  function resolve() {
    return resolveComment(marketId, id)
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        removeMessagesForCommentId(id, messagesState, workItemClasses.removed);
        if (inlineMarketId) {
          const inlineInvestibles = getMarketInvestibles(investiblesState, inlineMarketId) || []
          const anInlineMarketInvestibleComments = getMarketComments(commentsState, inlineMarketId) || []
          inlineInvestibles.forEach((inv) => {
            const messages = findMessagesForInvestibleId(inv.investible.id, messagesState) || [];
            const messageIds = messages.map((message) => message.type_object_id);
            messagesDispatch(removeMessages(messageIds));
          })
          anInlineMarketInvestibleComments.forEach((comment) => {
            const messages = findMessagesForCommentId(comment.id, messagesState) || [];
            const messageIds = messages.map((message) => message.type_object_id);
            messagesDispatch(removeMessages(messageIds));
          })
        }
        if (resolvedStageId) {
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
        onDone();
      });
  }

  function getHilightedIds(myReplies, highLightedIds, passedMessages) {
    const highlighted = highLightedIds || [];
    const messages = passedMessages || [];
    if (_.isEmpty(myReplies)) {
      return {highlighted, messages};
    }
    myReplies.forEach(reply => {
      const replyMessage = findMessageForCommentId(reply.id, messagesState);
      if (replyMessage) {
        const { level } = replyMessage;
        if (level) {
          messages.push(replyMessage);
          highlighted.push(reply.id);
        }
      }
    });
    myReplies.forEach((reply) => {
      const replyReplies = comments.filter(
        comment => comment.reply_id === reply.id
      );
      getHilightedIds(replyReplies, highlighted, messages);
    });
    return {highlighted, messages};
  }
  const {highlighted, messages} = getHilightedIds(replies);
  const diff = getDiff(diffState, id);
  const myHighlightedState = myMessage || {};
  const { level: myHighlightedLevel } = myHighlightedState;
  if (myHighlightedLevel) {
    messages.push(myMessage);
  }
  const overrideLabel = (marketType === PLANNING_TYPE && commentType === REPORT_TYPE
    && !creatorAssigned) ? <FormattedMessage id="reviewReportPresent" /> :
    (isMarketTodo ? <FormattedMessage id={`notificationLabel${myNotificationType}`} /> : undefined);
  const color = isMarketTodo ? myNotificationType : undefined;
  const displayUpdatedBy = updatedBy !== undefined && comment.updated_by !== comment.created_by;
  const showActions = (!replyBeingEdited || replies.length > 0) && !removeActions;
  function getCommentHighlightStyle() {
    if (isInbox && (!inboxMessageId || inboxMessageId === id)) {
      return classes.containerBlueLink;
    }
    if (myHighlightedLevel) {
      if (myHighlightedLevel === "YELLOW" || myHighlightedLevel === "BLUE") {
        return classes.containerYellow;
      }
      return classes.containerRed;
    }
    if (!_.isEmpty(highlighted) || (noHighlightId !== id && hashFragment?.includes(id))) {
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

  const showAcceptReject = commentType === SUGGEST_CHANGE_TYPE && investibleId && !resolved &&
    (myPresenceIsAssigned || myPresence === createdBy) && marketType === PLANNING_TYPE;
  const showMoveButton = isSent !== false && [TODO_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(commentType)
    && !inArchives
    && enableActions && (!resolved || commentType !== TODO_TYPE) && marketType === PLANNING_TYPE;
  const showConfigureVotingButton = commentType === QUESTION_TYPE && !inArchives && inlineMarketId && !resolved
    && !removeActions && myPresence === createdBy;
  const showResolve = isSent !== false && enableActions && commentType !== REPORT_TYPE &&
    (myPresence === createdBy || myPresence === updatedBy || !resolved);
  const yourVote = myInlinePresence && myInlinePresence.investments &&
    myInlinePresence.investments.find((investment) => !investment.deleted);
  const showAbstain = enableActions && inlineMarketId && myPresence !== createdBy && !resolved &&
    !myInlinePresence.abstain && !yourVote;
  const isDeletable = !isInbox && (commentType === REPORT_TYPE || isEditable || resolved);
  return (
    <div>
      <Card elevation={3} style={{overflow: 'unset', marginTop: isSent === false ? 0 : undefined}}
            className={getCommentHighlightStyle()}>
        <div onClick={() => {
          if (isInbox) {
            navigate(history, formCommentLink(marketId, groupId, investibleId, id));
          }
        }}>
          <Box display="flex">
            {overrideLabel && (
              <CardType className={classes.commentType} type={commentType} resolved={resolved} compact
                        subtype={commentType === TODO_TYPE && _.isEmpty(investibleId) ? BUG :
                          (commentType === REPORT_TYPE && !creatorAssigned ? IN_REVIEW : undefined)}
                        label={overrideLabel} color={color}
                        gravatar={noAuthor || mobileLayout ? undefined :
                          <GravatarAndName key={myPresence.id} email={createdBy.email}
                                           name={createdBy.name} typographyVariant="caption"
                                           typographyClassName={classes.createdBy}
                                           avatarClassName={classes.smallGravatar}
                          />}
              />
            )}
            {!overrideLabel && (
              <CardType className={classes.commentType} type={commentType} resolved={resolved || isSent === false}
                        compact gravatar={noAuthor || mobileLayout ? undefined :
                          <GravatarAndName key={myPresence.id} email={createdBy.email}
                                           name={createdBy.name} typographyVariant="caption"
                                           typographyClassName={classes.createdBy}
                                           avatarClassName={classes.smallGravatar}
                          />}
              />
            )}
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
                icon={<Edit fontSize='small' />}
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
                  icon={<Delete fontSize={mobileLayout ? 'small' : undefined} />}
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
                  messages={messages}
                />
              )}
            </Box>
          </CardContent>
          {showActions && !beingEdited && (
            <CardActions>
              <div className={classes.actions}>
                {commentType === SUGGEST_CHANGE_TYPE && !inArchives && !resolved && !inlineMarketId
                  && marketType === PLANNING_TYPE && (
                  <SpinningIconLabelButton
                    onClick={() => navigate(history, formWizardLink(JOB_COMMENT_CONFIGURE_WIZARD_TYPE, marketId,
                      undefined, undefined, id))}
                                           doSpin={false} icon={ThumbsUpDownIcon}>
                    {intl.formatMessage({ id: 'addVoting' })}
                  </SpinningIconLabelButton>
                )}
                {showDone && (
                  <SpinningIconLabelButton onClick={onDone} doSpin={false} icon={Clear}>
                    {!mobileLayout && intl.formatMessage({ id: 'done' })}
                  </SpinningIconLabelButton>
                )}
                {showAcceptReject && (
                  <SpinningIconLabelButton onClick={myAccept} icon={ListAltIcon} id={`convertToTask${id}`}>
                    {intl.formatMessage({ id: 'wizardAcceptLabel' })}
                  </SpinningIconLabelButton>
                )}
                {showResolve && (
                  <SpinningIconLabelButton
                    onClick={resolved ? reopen : resolve}
                    icon={resolved ? SettingsBackupRestore : Done}
                    id={`commentResolveReopenButton${id}`}
                  >
                    {(!mobileLayout || resolved) && intl.formatMessage({
                      id: resolved ? 'commentReopenLabel' : 'commentResolveLabel'
                    })}
                  </SpinningIconLabelButton>
                )}
                {inlineMarket.market_type === DECISION_TYPE && (
                  <SpinningIconLabelButton
                    doSpin={false}
                    onClick={() => navigate(history, formWizardLink(OPTION_WIZARD_TYPE, inlineMarketId))}
                    icon={AddIcon}
                    id={`addOptionButton${id}`}
                  >
                    {intl.formatMessage({ id: 'inlineAddLabel' })}
                  </SpinningIconLabelButton>
                )}
                {showAbstain && (
                  <SpinningIconLabelButton
                    onClick={abstain}
                    icon={NotInterested}
                    id={`commentAbstainButton${id}`}
                  >
                    {!mobileLayout && intl.formatMessage({ id: 'commentAbstainLabel' })}
                  </SpinningIconLabelButton>
                )}
                {isSent !== false && enableEditing && ((commentType !== REPORT_TYPE || overrideLabel)
                  || (mentions || []).includes(myPresence.id)) && (
                  <SpinningIconLabelButton
                    onClick={toggleReply}
                    icon={ReplyIcon}
                    id={`commentReplyButton${id}`}
                    doSpin={false}
                  >
                    {!mobileLayout && intl.formatMessage({ id: "commentReplyLabel" })}
                  </SpinningIconLabelButton>
                )}
                {showMoveButton && mobileLayout && (
                  <SpinningIconLabelButton
                    onClick={() => navigate(history,
                      `${formMarketAddInvestibleLink(marketId, groupId)}&fromCommentId=${id}`)}
                    doSpin={false}
                    icon={Eject}
                  />
                )}
              </div>
              <div className={mobileLayout ? classes.actions : classes.actionsEnd}>
                {showConfigureVotingButton && (
                  <SpinningIconLabelButton
                    onClick={() => navigate(history, formWizardLink(JOB_COMMENT_CONFIGURE_WIZARD_TYPE, marketId,
                      undefined, undefined, id))}
                    doSpin={false} icon={SettingsIcon}>
                    {intl.formatMessage({ id: 'configureVoting' })}
                  </SpinningIconLabelButton>
                )}
                {showMoveButton && !mobileLayout && (
                  <SpinningIconLabelButton
                    onClick={() => navigate(history,
                      `${formMarketAddInvestibleLink(marketId, groupId)}&fromCommentId=${id}`)}
                    doSpin={false}
                    icon={Eject}
                  >
                    {intl.formatMessage({ id: "storyFromComment" })}
                  </SpinningIconLabelButton>
                )}
                {myMessage && diff && !mobileLayout && !removeActions && (
                  <SpinningIconLabelButton icon={showDiff ? ExpandLess : ExpandMoreIcon} onClick={toggleDiffShow}
                                           doSpin={false}>
                    <FormattedMessage id={showDiff ? 'diffDisplayDismissLabel' : 'diffDisplayShowLabel'} />
                  </SpinningIconLabelButton>
                )}
              </div>
            </CardActions>
          )}
        </div>
      </Card>
      {replyBeingEdited && marketId && comment && (
        <CommentAdd
          marketId={marketId}
          groupId={groupId}
          parent={comment}
          onSave={toggleReply}
          onCancel={toggleReply}
          type={REPLY_TYPE}
          commentAddState={replyAddState}
          updateCommentAddState={updateReplyAddState}
          commentAddStateReset={replyAddStateReset}
          threadMessages={messages}
          nameDifferentiator="reply"
        />
      )}
      <Box marginTop={1} paddingX={1} className={classes.childWrapper}>
        <LocalCommentsContext.Provider value={{ comments, marketId }}>
          {sortedReplies.map(child => {
              const { id: childId } = child;
              return (
                <InitialReply
                  key={childId}
                  comment={child}
                  marketId={marketId}
                  enableEditing={enableEditing}
                  messages={messages}
                  replyEditId={replyEditId}
                  inboxMessageId={inboxMessageId}
                  isInbox={isInbox}
                />
              );
            })}
        </LocalCommentsContext.Provider>
      </Box>
      {getDecision(inlineMarketId)}
    </div>
  );
}

Comment.propTypes = {
  comment: PropTypes.object.isRequired,
  noAuthor: PropTypes.bool,
  readOnly: PropTypes.bool,
  onDone: PropTypes.func,
  comments: PropTypes.arrayOf(PropTypes.object).isRequired,
  marketId: PropTypes.string.isRequired
};

Comment.defaultProps = {
  noAuthor: false,
  readOnly: false,
  onDone: () => {}
};

function InitialReply(props) {
  const { comment, enableEditing, messages, replyEditId, inboxMessageId, isInbox } = props;

  return <Reply comment={comment} enableEditing={enableEditing} messages={messages} replyEditId={replyEditId}
                inboxMessageId={inboxMessageId} isInbox={isInbox}/>;
}

const useReplyStyles = makeStyles(
  theme => {
    return {
      actions: {
        display: "flex",
        boxShadow: "none",
        width: "100%"
      },
      action: {
        padding: "0 4px",
        minWidth: "20px",
        height: "20px",
        color: "#A7A7A7",
        fontWeight: "bold",
        fontSize: 12,
        lineHeight: "18px",
        textTransform: "capitalize",
        background: "transparent",
        borderRight: "none !important",
        "&:hover": {
          color: "#ca2828",
          background: "white",
          boxShadow: "none"
        },
        display: "inline-block"
      },
      cardContent: {
        // 25px in Figma
        marginLeft: theme.spacing(3),
        padding: 0
      },
      cardActions: {
        marginLeft: theme.spacing(3),
        padding: 0
      },
      cardActionsYellow: {
        marginLeft: theme.spacing(3),
        boxShadow: "4px 4px 4px yellow",
        padding: 0
      },
      cardActionsRed: {
        marginLeft: theme.spacing(3),
        boxShadow: "4px 4px 4px red",
        padding: 0
      },
      commenter: {
        color: "#7E7E7E",
        display: "inline-block",
        fontSize: 14,
        fontWeight: "bold",
        marginRight: "8px"
      },
      replyContainer: {
        marginLeft: theme.spacing(3)
      },
      timeElapsed: {
        color: "#A7A7A7",
        display: "inline-block",
        fontSize: 14
      },
      timePosted: {
        color: "#A7A7A7",
        display: "inline-block",
        fontSize: 12,
        fontWeight: "bold"
      },
      container: {
        marginTop: '1.5rem',
        marginRight: '0.25rem',
        overflow: 'unset'
      },
      containerBlueLink: {
        boxShadow: "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px blue",
        overflow: 'unset',
        marginTop: "1.5rem",
        marginRight: '0.25rem',
        paddingRight: '0.5rem',
        cursor: 'pointer'
      },
      containerYellow: {
        marginTop: '1.5rem',
        boxShadow: "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px blue",
        marginRight: '0.25rem',
        paddingRight: '0.5rem',
        overflow: 'unset'
      },
      containerRed: {
        marginTop: '1.5rem',
        boxShadow: "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px red",
        marginRight: '0.25rem',
        paddingRight: '0.5rem',
        overflow: 'unset'
      },
      editor: {
        margin: "2px 0px",
        "& .ql-editor": {
          paddingTop: 0,
          paddingBottom: 0
        }
      }
    };
  },
  { name: "Reply" }
);

/**
 * @type {Presence}
 */
const unknownPresence = {
  name: "unknown",
  email: ""
};

/**
 *
 * @param {{comment: Comment}} props
 */
function Reply(props) {
  const { comment, messages, enableEditing, replyEditId, inboxMessageId, isInbox } = props;
  const history = useHistory();
  const myParams = new URL(document.location).searchParams;
  const replyBeingEdited = replyEditId === comment.id && myParams && !_.isEmpty(myParams.get('reply'));
  const beingEdited = replyEditId === comment.id && !replyBeingEdited;
  const isFromInbox = myParams && !_.isEmpty(myParams.get('inbox'));
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const marketId = useMarketId()
  const presences = usePresences(marketId);
  const commenter = useCommenter(comment, presences) || unknownPresence;
  const [marketsState] = useContext(MarketsContext);
  const [hashFragment, noHighlightId, setNoHighlightId] = useContext(ScrollContext);
  const [messagesState] = useContext(NotificationsContext);
  const [, commentsDispatch] = useContext(CommentsContext);
  const workItemClasses = workListStyles();
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const myMessage = findMessageForCommentId(comment.id, messagesState) || {};
  const userId = getMyUserForMarket(marketsState, marketId) || {};
  const myPresence = presences.find(presence => presence.id === userId) || {};
  const isEditable = comment.created_by === userId;
  const classes = useReplyStyles();
  const [replyAddStateFull, replyAddDispatch] = usePageStateReducer('replyAdd');
  const [replyAddState, updateReplyAddState, replyAddStateReset] =
    getPageReducerPage(replyAddStateFull, replyAddDispatch, comment.id);
  const [editStateFull, editDispatch] = usePageStateReducer('commentEdit');
  const [editState, updateEditState, editStateReset] = getPageReducerPage(editStateFull, editDispatch, comment.id);

  function handleEditClick() {
    navigateEditReplyBack(history, comment.id, marketId, comment.group_id, comment.investible_id, replyEditId,
      false, isFromInbox, setNoHighlightId);
  }

  function remove() {
    setOperationRunning(true);
    return removeComment(marketId, comment.id)
      .then(() => {
        removeComments(commentsDispatch, marketId, [comment.id]);
        removeMessagesForCommentId(comment.id, messagesState, workItemClasses.removed);
        setOperationRunning(false);
      });
  }

  function setBeingEdited(value, event) {
    if (mobileLayout || invalidEditEvent(event, history)) {
      return;
    }
    handleEditClick();
  }

  function setReplyOpen() {
    navigateEditReplyBack(history, comment.id, marketId, comment.group_id, comment.investible_id, replyEditId,
      true, isFromInbox, setNoHighlightId);
  }
  const { level: myHighlightedLevel } = myMessage;
  const isLinkedTo = noHighlightId !== comment.id && hashFragment?.includes(comment.id);
  const isHighlighted = myHighlightedLevel || isLinkedTo;
  const intl = useIntl();
  function getHighlightClass() {
    if (isInbox) {
      if (inboxMessageId) {
        if (inboxMessageId === comment.id) {
          return classes.containerBlueLink;
        }
      }
    }
    return !isHighlighted ? classes.container : (isLinkedTo || (myMessage.level === 'RED')
      ? classes.containerRed : classes.containerYellow);
  }
  return (
    <div>
      <Card className={getHighlightClass()} id={`c${comment.id}`}>
        <CardContent className={classes.cardContent}>
          <Typography className={classes.commenter} variant="body2">
            {commenter.name}
          </Typography>
          <Typography className={classes.timeElapsed} variant="body2">
            <UsefulRelativeTime
              value={comment.created_at}
            />
          </Typography>
          {(myPresence.is_admin || isEditable) && enableEditing && !isFromInbox && (
            <TooltipIconButton
              disabled={operationRunning !== false}
              onClick={remove}
              icon={<Delete fontSize={mobileLayout ? 'small' : undefined} />}
              size={mobileLayout ? 'small' : undefined}
              translationId="commentRemoveLabel"
              doFloatRight
            />
          )}
          {beingEdited && (
            <CommentEdit
              intl={intl}
              onCancel={handleEditClick}
              onSave={handleEditClick}
              marketId={marketId}
              editState={editState}
              updateEditState={updateEditState}
              editStateReset={editStateReset}
              comment={comment}
              messages={messages}
            />
          )}
          {!beingEdited && !_.isEmpty(comment) && (
            <ReadOnlyQuillEditor
              className={classes.editor}
              value={comment.body}
              id={comment.id}
              noOverflow={isFromInbox}
              setBeingEdited={setBeingEdited}
              isEditable={!mobileLayout && enableEditing && isEditable}
            />
          )}
        </CardContent>
        {!beingEdited && (
          <CardActions className={classes.cardActions}>
            <Typography className={classes.timePosted} variant="body2">
              <FormattedDate value={comment.created_at} />
            </Typography>
            {enableEditing && (
              <Button
                className={classes.action}
                id={`commentReplyButton${comment.id}`}
                onClick={() => setReplyOpen()}
                variant="text"
              >
                {intl.formatMessage({ id: "issueReplyLabel" })}
              </Button>
            )}
            {enableEditing && isEditable && mobileLayout && (
              <Button
                className={classes.action}
                onClick={handleEditClick}
                variant="text"
              >
                <FormattedMessage id="commentEditLabel" />
              </Button>
            )}
          </CardActions>
        )}
      </Card>
      <div className={classes.replyContainer}>
        {replyBeingEdited && marketId && comment && (
          <CommentAdd
            marketId={marketId}
            groupId={comment.group_id}
            parent={comment}
            onSave={() => setReplyOpen()}
            onCancel={() => setReplyOpen()}
            type={REPLY_TYPE}
            commentAddState={replyAddState}
            updateCommentAddState={updateReplyAddState}
            commentAddStateReset={replyAddStateReset}
            threadMessages={messages}
            nameDifferentiator="reply"
          />
        )}
      </div>
      {comment.children !== undefined && (
        <div className={classes.cardContent}>
          <ThreadedReplies
            replies={comment.children}
            enableEditing={enableEditing}
            messages={messages}
            replyEditId={replyEditId}
          />
        </div>
      )}
    </div>
  );
}
Reply.propTypes = {
  comment: PropTypes.object.isRequired
};

const useThreadedReplyStyles = makeStyles(
  {
    container: {
      borderLeft: "2px solid #ADADAD",
      listStyle: "none",
      margin: 0,
      marginTop: 15,
      padding: 0
    },
    visible: {
      overflow: 'visible'
    }
  },
  { name: "ThreadedReplies" }
);
/**
 *
 * @param {{comments: Comment[], replies: string[]}} props
 */
function ThreadedReplies(props) {
  const { replies: replyIds, enableEditing, messages, replyEditId } = props;
  const comments = useComments();

  const classes = useThreadedReplyStyles();

  const replies = [];
  (replyIds || []).forEach((replyId) => {
    const aReply = comments.find(comment => comment.id === replyId);
    // If on Inbox might not be displaying all so don't freak if not found
    if (aReply) {
      replies.push(aReply);
    }
  });

  const sortedReplies = _.sortBy(replies, "created_at");

  return (
    <ol className={classes.container}>
      {sortedReplies.map((reply) => {
        if (reply) {
          return (
            <ThreadedReply
              className={classes.visible}
              comment={reply}
              key={`threadc${reply.id}`}
              enableEditing={enableEditing}
              messages={messages}
              replyEditId={replyEditId}
            />
          );
        }
        return React.Fragment;
      })}
    </ol>
  );
}

function ThreadedReply(props) {
  const { comment, enableEditing, messages, replyEditId } = props;
  return <Reply key={`c${comment.id}`} id={`c${comment.id}`} className={props.className} comment={comment}
                enableEditing={enableEditing} messages={messages} replyEditId={replyEditId} />;
}

/**
 * user-like
 * @typedef {Object} Presence
 * @property {string} name -
 */

/**
 *
 * @typedef {Object} Comment
 * @property {string} id
 * @property {string[]} [children] - ids of comments
 * @property {string} created_by - presence id of creator
 * @property {string} created_at -
 * @property {string} updated_by - presence id of updater
 * @property {string} updated_at -
 */

/**
 * @param {Comment} comment
 * @param {Presence[]} presences
 * @returns {Presence | undefined}
 */
function useCommenter(comment, presences) {
  return presences.find(presence => presence.id === comment.created_by);
}

/**
 * @param {Comment} comment
 * @param {Presence[]} presences
 * @returns {Presence | undefined}
 */
function useUpdatedBy(comment, presences) {
  return presences.find(presence => presence.id === comment.updated_by);
}

export default Comment;
