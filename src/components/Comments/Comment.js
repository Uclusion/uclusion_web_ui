import React, { useContext, useState } from 'react'
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import {
  Box,
  Button,
  Card,
  CardActions,
  CardContent,
  Checkbox,
  FormControlLabel,
  Grid,
  Typography, useMediaQuery, useTheme
} from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import _ from 'lodash'
import ReadOnlyQuillEditor from '../TextEditors/ReadOnlyQuillEditor'
import CommentAdd from './CommentAdd'
import {
  ISSUE_TYPE,
  JUSTIFY_TYPE,
  QUESTION_TYPE,
  REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE, TODO_TYPE,
} from '../../constants/comments'
import { removeComment, reopenComment, resolveComment } from '../../api/comments'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import CommentEdit from './CommentEdit'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import {
  addMarket,
  addMarketToStorage,
  getMarket,
  getMyUserForMarket
} from '../../contexts/MarketsContext/marketsContextHelper'
import CardType from '../CardType'
import { SECTION_TYPE_SECONDARY } from '../../constants/global'
import {
  addCommentToMarket,
  getMarketComments,
  removeComments
} from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { ACTIVE_STAGE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
import { red } from '@material-ui/core/colors'
import { EXPANDED_CONTROL, ExpandedCommentContext } from '../../contexts/CommentsContext/ExpandedCommentContext'
import UsefulRelativeTime from '../TextFields/UseRelativeTime'
import {
  addInvestible,
  getMarketInvestibles
} from '../../contexts/InvestibesContext/investiblesContextHelper'
import SubSection from '../../containers/SubSection/SubSection'
import CurrentVoting from '../../pages/Dialog/Decision/CurrentVoting'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import ProposedIdeas from '../../pages/Dialog/Decision/ProposedIdeas'
import {
  getInCurrentVotingStage, getInReviewStage,
  getProposedOptionsStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { formMarketAddInvestibleLink, navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { createInitiative, updateMarket } from '../../api/markets'
import ShareStoryButton from '../../pages/Investible/Planning/ShareStoryButton'
import { onCommentOpen } from '../../utils/commentFunctions'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import {
  findMessageForCommentId, findMessagesForCommentId,
  findMessagesForInvestibleId,
  removeMessagesForCommentId
} from '../../utils/messageUtils'
import GravatarAndName from '../Avatars/GravatarAndName'
import { invalidEditEvent } from '../../utils/windowUtils'
import DecisionInvestibleAdd from '../../pages/Dialog/Decision/DecisionInvestibleAdd'
import ExpandableAction from '../SidebarActions/Planning/ExpandableAction'
import AddIcon from '@material-ui/icons/Add'
import { deleteOrDehilightMessages } from '../../api/users'
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton'
import { Clear, Delete, Done, Edit, Eject, ExpandLess, ExpandMore, SettingsBackupRestore } from '@material-ui/icons'
import ReplyIcon from '@material-ui/icons/Reply'
import TooltipIconButton from '../Buttons/TooltipIconButton'
import { getPageReducerPage, usePageStateReducer } from '../PageState/pageStateHooks'
import InlineInitiativeBox from '../../containers/CommentBox/InlineInitiativeBox'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { getDiff, markDiffViewed } from '../../contexts/DiffContext/diffContextHelper'
import { DiffContext } from '../../contexts/DiffContext/DiffContext'
import DiffDisplay from '../TextEditors/DiffDisplay'
import TokenStorageManager, { TOKEN_TYPE_MARKET } from '../../authorization/TokenStorageManager'
import { removeMessage } from '../../contexts/NotificationsContext/notificationsContextReducer'

const useCommentStyles = makeStyles(
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
        backgroundColor: "#2D9CDB",
        color: "white",
        "&:hover": {
          backgroundColor: "#2D9CDB"
        }
      },
      actionSecondary: {
        backgroundColor: "#BDBDBD",
        color: "black",
        "&:hover": {
          backgroundColor: "#BDBDBD"
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
        boxShadow: "10px 5px 5px red",
        overflow: "visible",
        marginBottom: "1.5rem"
      },
      containerYellow: {
        boxShadow: "10px 5px 5px yellow",
        overflow: "visible",
        marginBottom: "1.5rem"
      },
      container: {
        overflow: "visible",
        marginBottom: "1.5rem"
      },
      inlineBorder: {
        border: '1px solid black',
        borderRadius: '0 6px 6px 6px',
        marginBottom: '1.5rem'
      },
      inlineBorderNone: {},
      timeElapsed: {
        whiteSpace: 'nowrap',
        paddingRight: '50px',
        paddingTop: '5px',
        [theme.breakpoints.down('sm')]: {
          display: 'none'
        },
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

/**
 * A question or issue
 * @param {{comment: Comment, comments: Comment[]}} props
 */
function Comment(props) {
  const { comment, marketId, comments, allowedTypes, noAuthor, onDone,  readOnly } = props;
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const intl = useIntl();
  const classes = useCommentStyles();
  const { id, comment_type: commentType, investible_id: investibleId, inline_market_id: inlineMarketId,
    resolved, notification_type: myNotificationType, creation_stage_id: createdStageId,
    mentions, body, creator_assigned: creatorAssigned } = comment;
  const presences = usePresences(marketId);
  const createdBy = useCommenter(comment, presences) || unknownPresence;
  const updatedBy = useUpdatedBy(comment, presences) || unknownPresence;
  const [marketsState, marketsDispatch] = useContext(MarketsContext);
  const inlineMarket = getMarket(marketsState, inlineMarketId) || {};
  const inlineUserId = getMyUserForMarket(marketsState, inlineMarketId) || {};
  const { allow_multi_vote: originalAllowMultiVote, created_by: inlineCreatedBy } = inlineMarket;
  const [multiVote, setMultiVote] = useState(originalAllowMultiVote);
  const market = getMarket(marketsState, marketId) || {};
  const { market_stage: marketStage, market_type: marketType } = market;
  const activeMarket = marketStage === ACTIVE_STAGE;
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const inArchives = !activeMarket || !myPresence.following;
  const replies = comments.filter(comment => comment.reply_id === id);
  const sortedReplies = _.sortBy(replies, "created_at");
  const [expandedCommentState, expandedCommentDispatch] = useContext(ExpandedCommentContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketPresencesState, presenceDispatch] = useContext(MarketPresencesContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [diffState, diffDispatch] = useContext(DiffContext);
  const enableActions = !inArchives && !readOnly;
  const enableEditing = !inArchives && !resolved && !readOnly; //resolved comments or those in archive aren't editable
  const [investibleAddStateFull, investibleAddDispatch] = usePageStateReducer('commentInvestibleAdd');
  const [investibleAddState, updateInvestibleAddState, investibleAddStateReset] =
    getPageReducerPage(investibleAddStateFull, investibleAddDispatch, id);
  const {
    investibleAddBeingEdited,
  } = investibleAddState;
  const [replyAddStateFull, replyAddDispatch] = usePageStateReducer('replyAdd');
  const [replyAddState, updateReplyAddState, replyAddStateReset] =
    getPageReducerPage(replyAddStateFull, replyAddDispatch, id);
  const {
    replyBeingEdited,
  } = replyAddState;
  const [editStateFull, editDispatch] = usePageStateReducer('commentEdit');
  const [editState, updateEditState, editStateReset] = getPageReducerPage(editStateFull, editDispatch, id);
  const {
    beingEdited,
    showDiff
  } = editState;
  const myExpandedState = expandedCommentState[id] || {};
  const { expanded: myRepliesExpanded } = myExpandedState;
  // If I resolved a comment then I am done with it and so hide the thread
  const repliesExpanded = noAuthor ? true : (myRepliesExpanded === undefined ?
    (resolved ? myPresence !== updatedBy : true) : myRepliesExpanded);

  function toggleInlineInvestibleAdd() {
    updateInvestibleAddState({investibleAddBeingEdited: !investibleAddBeingEdited});
  }

  function toggleMultiVote() {
    const myMultiVote = !multiVote;
    setMultiVote(myMultiVote);
    if (myMultiVote !== originalAllowMultiVote) {
      return updateMarket(inlineMarketId, null, null, null, null,
        null, null, myMultiVote)
        .then((market) => {
          addMarketToStorage(marketsDispatch, undefined, market);
        });
    }
  }

  function toggleDiffShow() {
    if (showDiff) {
      markDiffViewed(diffDispatch, id);
    }
    updateEditState({showDiff: !showDiff});
  }

  function allowSuggestionVote() {
    setOperationRunning(true);
    const addInfo = {
      name: 'NA',
      market_type: INITIATIVE_TYPE,
      description: 'NA',
      parent_comment_id: id,
    };
    return createInitiative(addInfo)
      .then((result) => {
        addMarket(result, marketsDispatch, () => {}, presenceDispatch);
        const { market: { id: inlineMarketId }, parent, token, investible } = result;
        addCommentToMarket(parent, commentState, commentDispatch);
        addInvestible(investiblesDispatch, () => {}, investible);
        setOperationRunning(false);
        const tokenStorageManager = new TokenStorageManager();
        return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, inlineMarketId, token);
      });
  }

  function toggleReply() {
    updateReplyAddState({replyBeingEdited: !replyBeingEdited});
  }

  function toggleEdit() {
    updateEditState({beingEdited: !beingEdited});
  }

  function setBeingEdited(value, event) {
    if (mobileLayout || invalidEditEvent(event, history)) {
      return;
    }
    updateEditState({beingEdited: value, body});
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

  const isEditable = comment.created_by === myPresence.id;

  function getDialog(anInlineMarket) {
    const inlineInvestibles = getMarketInvestibles(investiblesState, anInlineMarket.id) || [];
    const anInlineMarketInvestibleComments = getMarketComments(commentsState, anInlineMarket.id) || [];
    const anInlineMarketPresences = getMarketPresences(marketPresencesState, anInlineMarket.id) || [];
    const underConsiderationStage = getInCurrentVotingStage(marketStagesState, anInlineMarket.id);
    const underConsideration = getInlineInvestiblesForStage(underConsiderationStage, inlineInvestibles);
    const proposedStage = getProposedOptionsStage(marketStagesState, anInlineMarket.id);
    const proposed = getInlineInvestiblesForStage(proposedStage, inlineInvestibles);
    if (_.isEmpty(inlineInvestibles)) {
      //Inline only created when an option is and no delete - this prevents showing no option in red while loading
      return React.Fragment;
    }
    return (
      <>
        <Grid item xs={12} style={{marginTop: '1rem'}}>
          <SubSection
            id="currentVoting"
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'decisionDialogCurrentVotingLabel' })}
            actionButton={!enableEditing ? null :
              (<ExpandableAction
                icon={<AddIcon htmlColor="black"/>}
                label={intl.formatMessage({ id: 'createDialogApprovableExplanation' })}
                openLabel={intl.formatMessage({
                  id: mobileLayout ? 'inlineAddLabelMobile' :
                    'decisionDialogAddInvestibleLabel'
                })}
                onClick={toggleInlineInvestibleAdd}
                disabled={!isEditable}
                tipPlacement="top-end"
              />)}
          >
            <CurrentVoting
              marketPresences={anInlineMarketPresences}
              investibles={underConsideration}
              marketId={anInlineMarket.id}
              comments={anInlineMarketInvestibleComments}
              inArchives={inArchives}
              isAdmin={isEditable}
            />
          </SubSection>
        </Grid>
        <Grid item xs={12} style={{marginTop: '1rem'}}>
          <SubSection
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'decisionDialogProposedOptionsLabel' })}
            actionButton={ inArchives ? null :
              (<ExpandableAction
                icon={<AddIcon htmlColor="black"/>}
                label={intl.formatMessage({ id: 'createDialogProposedExplanation' })}
                openLabel={intl.formatMessage({ id: 'decisionDialogProposeInvestibleLabel'})}
                onClick={toggleInlineInvestibleAdd}
                disabled={isEditable}
                tipPlacement="top-end"
              />)}
          >
            <ProposedIdeas
              investibles={proposed}
              marketId={anInlineMarket.id}
              comments={anInlineMarketInvestibleComments}
              isAdmin={isEditable}
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
    if (!parentCommentId) {
      return React.Fragment;
    }
    if (marketType === INITIATIVE_TYPE) {
      return <InlineInitiativeBox anInlineMarket={anInlineMarket} inlineUserId={inlineUserId}
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
        removeMessagesForCommentId(id, messagesState,messagesDispatch);
        setOperationRunning(false);
        onDone();
      });
  }
  function remove() {
    setOperationRunning(true);
    return removeComment(marketId, id)
      .then(() => {
        removeComments(commentsDispatch, marketId, [id]);
        removeMessagesForCommentId(id, messagesState,messagesDispatch);
        setOperationRunning(false);
        onDone();
      });
  }
  function resolve() {
    return resolveComment(marketId, id)
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch);
        removeMessagesForCommentId(id, messagesState, messagesDispatch);
        if (inlineMarketId) {
          const inlineInvestibles = getMarketInvestibles(investiblesState, inlineMarketId) || [];
          const anInlineMarketInvestibleComments = getMarketComments(commentsState, inlineMarketId) || [];
          inlineInvestibles.forEach((inv) => {
            const messages = findMessagesForInvestibleId(inv.investible.id, messagesState) || [];
            messages.forEach((message) => {
              messagesDispatch(removeMessage(message));
            })
          })
          anInlineMarketInvestibleComments.forEach((comment) => {
            const messages = findMessagesForCommentId(comment.id, messagesState) || [];
            messages.forEach((message) => {
              messagesDispatch(removeMessage(message));
            })
          })
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
        const { level, is_highlighted: isHighlighted } = replyMessage;
        if (level && isHighlighted) {
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
  const myMessage = findMessageForCommentId(id, messagesState);
  const diff = getDiff(diffState, id);
  const myHighlightedState = myMessage || {};
  const { level: myHighlightedLevel, is_highlighted: isHighlighted } = myHighlightedState;
  if (isHighlighted) {
    messages.push(myMessage);
  }
  const inReviewStageId = (getInReviewStage(marketStagesState, marketId) || {}).id;
  const createdInReview = createdStageId === inReviewStageId;
  const overrideLabel = (marketType === PLANNING_TYPE && commentType === REPORT_TYPE
    && createdInReview && !creatorAssigned) ?
    <FormattedMessage id="reviewReportPresent" /> : undefined;

  const displayUpdatedBy = updatedBy !== undefined && comment.updated_by !== comment.created_by;
  const showActions = !replyBeingEdited || replies.length > 0;
  function getCommentHighlightStyle() {
    if (myHighlightedLevel && isHighlighted) {
      if (myHighlightedLevel === "YELLOW" || myHighlightedLevel === "BLUE") {
        return classes.containerYellow;
      }
      return classes.containerRed;
    }
    if (!_.isEmpty(highlighted) && !repliesExpanded) {
      return classes.containerYellow;
    }
    return classes.container;
  }
  const displayingDiff = myMessage && showDiff && diff;
  const displayEditing = enableEditing && isEditable;
  return (
    <div className={getCommentHighlightStyle()}>
      <Card elevation={3} style={{overflow: 'unset'}}>
        <>
          <Box display="flex">
            {overrideLabel && (
              <CardType className={classes.commentType} type={commentType} resolved={resolved} label={overrideLabel} />
            )}
            {!overrideLabel && (
              <CardType className={classes.commentType} type={commentType} resolved={resolved} />
            )}
            {commentType !== JUSTIFY_TYPE && commentType !== REPLY_TYPE && (
              <Typography className={classes.timeElapsed} variant="body2">
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
            {displayEditing && mobileLayout && !beingEdited && (
              <SpinningIconLabelButton
                onClick={() => {updateEditState({beingEdited: true, body})}}
                doSpin={false}
                icon={Edit}
              >
                <FormattedMessage id="edit" />
              </SpinningIconLabelButton>
            )}
            {commentType !== JUSTIFY_TYPE && commentType !== REPLY_TYPE && (
              <div style={{marginRight: '2rem', marginTop: '0.5rem'}}>
                <ShareStoryButton commentId={id} commentType={commentType} investibleId={investibleId} />
              </div>
            )}
            {(myPresence.is_admin || isEditable) && enableActions &&
            (commentType === REPORT_TYPE || isEditable || resolved) && (
              <div style={{marginRight: '2rem', marginTop: '0.5rem'}}>
                <TooltipIconButton
                  disabled={operationRunning !== false}
                  onClick={remove}
                  icon={<Delete />}
                  translationId="commentRemoveLabel"
                />
              </div>
            )}
          </Box>
          <CardContent className={classes.cardContent}>
            {!noAuthor && (
              <GravatarAndName
                key={myPresence.id}
                email={createdBy.email}
                name={createdBy.name}
                typographyVariant="caption"
                typographyClassName={classes.createdBy}
              />
            )}
            <Box marginTop={1}>
              {!beingEdited && !displayingDiff && (
                <ReadOnlyQuillEditor value={comment.body} setBeingEdited={setBeingEdited}
                                     isEditable={!mobileLayout && displayEditing}/>
              )}
              {!beingEdited && displayingDiff && (
                <DiffDisplay id={id} />
              )}
              {beingEdited && (
                <CommentEdit
                  marketId={marketId}
                  comment={comment}
                  onSave={toggleEdit}
                  allowedTypes={allowedTypes}
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
                {investibleId && commentType === REPORT_TYPE && (
                  <div style={{marginLeft: '1rem', paddingTop: '0.5rem'}}>
                    <FormControlLabel
                      control={<Checkbox
                        style={{ maxHeight: '1rem' }}
                        id="notifyAll"
                        name="notifyAll"
                        checked={myNotificationType === 'YELLOW'}
                        disabled={true}
                      />}
                      label={intl.formatMessage({ id: 'notifyAll' })}
                    />
                  </div>
                )}
                {commentType === QUESTION_TYPE && enableEditing && !inlineMarketId && marketType === PLANNING_TYPE && (
                  <SpinningIconLabelButton
                    disabled={!isEditable}
                    onClick={toggleInlineInvestibleAdd}
                    doSpin={false}
                    icon={AddIcon}
                  >
                    {intl.formatMessage({ id: mobileLayout ? 'inlineAddLabelMobile' : 'inlineAddLabel' })}
                  </SpinningIconLabelButton>
                )}
                {commentType === SUGGEST_CHANGE_TYPE && !inArchives && !resolved && !inlineMarketId && marketType === PLANNING_TYPE && (
                  <div style={{marginLeft: '1rem', marginRight: '0.5rem', paddingTop: '0.25rem'}}>
                    <Typography style={{ whiteSpace:'nowrap',}}>
                      {intl.formatMessage({ id: mobileLayout ? 'allowVoteSuggestionMobile' : 'allowVoteSuggestion' })}
                      <Checkbox
                        style={{maxHeight: '1rem'}}
                        id="suggestionVote"
                        name="suggestionVote"
                        checked={!_.isEmpty(inlineMarketId)}
                        onChange={allowSuggestionVote}
                        disabled={operationRunning !== false || !isEditable}
                      />
                    </Typography>
                  </div>
                )}
                {!mobileLayout && !noAuthor && (replies.length > 0 || inlineMarketId) && (
                  <SpinningIconLabelButton
                    icon={repliesExpanded ? ExpandLess : ExpandMore}
                    doSpin={false}
                    onClick={() => {
                      expandedCommentDispatch({ type: EXPANDED_CONTROL, commentId: id, expanded: !repliesExpanded });
                    }}
                  >
                    <FormattedMessage
                      id={
                        repliesExpanded
                          ? "commentCloseThreadLabel"
                          : "commentViewThreadLabel"
                      }
                    />
                  </SpinningIconLabelButton>
                )}
                {noAuthor && (
                  <SpinningIconLabelButton onClick={onDone} doSpin={false} icon={Clear}>
                    {intl.formatMessage({ id: 'done' })}
                  </SpinningIconLabelButton>
                )}
                {!mobileLayout && !_.isEmpty(messages) && (
                  <SpinningIconLabelButton onClick={() => {
                    deleteOrDehilightMessages(messages, messagesDispatch).then(() => setOperationRunning(false))
                      .finally(() => {
                        setOperationRunning(false);
                      });
                  }} icon={SettingsBackupRestore} id={`markReadButton${id}`}>
                    {intl.formatMessage({ id: 'markRead' })}
                  </SpinningIconLabelButton>
                )}
                {enableActions && commentType !== REPORT_TYPE && (!resolved || isEditable
                  || myPresence === updatedBy || [TODO_TYPE, ISSUE_TYPE].includes(commentType)) && (
                  <SpinningIconLabelButton
                    onClick={resolved ? reopen : resolve}
                    icon={resolved ? SettingsBackupRestore : Done}
                    id={`commentResolveReopenButton${id}`}
                  >
                    {intl.formatMessage({
                      id: resolved ? "commentReopenLabel" : "commentResolveLabel"
                    })}
                  </SpinningIconLabelButton>
                )}
                {enableEditing && ((commentType !== REPORT_TYPE || overrideLabel)
                  || (mentions || []).includes(myPresence.id)) && (
                  <SpinningIconLabelButton
                    onClick={toggleReply}
                    icon={ReplyIcon}
                    doSpin={false}
                  >
                    {intl.formatMessage({ id: "commentReplyLabel" })}
                  </SpinningIconLabelButton>
                )}
              </div>
              <div className={classes.actionsEnd}>
                {commentType === QUESTION_TYPE && !inArchives && inlineMarketId && !resolved && (
                  <div style={{marginRight: '1rem', paddingTop: '0.5rem'}}>
                    <Typography style={{fontSize: 12}}>
                      {intl.formatMessage({ id: mobileLayout ? 'allowMultiVoteQuestionMobile'
                          : 'allowMultiVoteQuestion' })}
                      <Checkbox
                        style={{maxHeight: '1rem'}}
                        id="multiVote"
                        name="multiVote"
                        checked={multiVote}
                        onChange={toggleMultiVote}
                        disabled={operationRunning !== false || inlineCreatedBy !== inlineUserId}
                      />
                    </Typography>
                  </div>
                )}
                {!mobileLayout && (!investibleId || commentType === TODO_TYPE) && !inArchives && enableActions
                && !resolved && marketType === PLANNING_TYPE && (
                  <SpinningIconLabelButton
                    onClick={() => navigate(history, `${formMarketAddInvestibleLink(marketId)}#fromCommentId=${id}`)}
                    doSpin={false}
                    icon={Eject}
                  >
                    {intl.formatMessage({ id: "storyFromComment" })}
                  </SpinningIconLabelButton>
                )}
                {myMessage && diff && !mobileLayout && (
                  <SpinningIconLabelButton icon={showDiff ? ExpandLess : ExpandMoreIcon} onClick={toggleDiffShow}
                                           doSpin={false}>
                    <FormattedMessage id={showDiff ? 'diffDisplayDismissLabel' : 'diffDisplayShowLabel'} />
                  </SpinningIconLabelButton>
                )}
              </div>
            </CardActions>
          )}
          {replyBeingEdited && marketId && comment && (
            <CommentAdd
              marketId={marketId}
              parent={comment}
              onSave={toggleReply}
              onCancel={toggleReply}
              type={REPLY_TYPE}
              commentAddState={replyAddState}
              updateCommentAddState={updateReplyAddState}
              commentAddStateReset={replyAddStateReset}
            />
          )}
          <Box marginTop={1} paddingX={1} className={classes.childWrapper}>
            <LocalCommentsContext.Provider value={{ comments, marketId }}>
              {repliesExpanded &&
              sortedReplies.map(child => {
                const { id: childId } = child;
                return (
                  <InitialReply
                    key={childId}
                    comment={child}
                    marketId={marketId}
                    enableEditing={enableEditing}
                    messages={messages}
                  />
                );
              })}
            </LocalCommentsContext.Provider>
          </Box>
          {investibleAddBeingEdited && (
            <div style={{marginTop: '2rem'}}>
              <DecisionInvestibleAdd
                marketId={inlineMarketId}
                onSave={(investible) => addInvestible(investiblesDispatch, () => {}, investible)}
                onCancel={toggleInlineInvestibleAdd}
                onSpinComplete={toggleInlineInvestibleAdd}
                isAdmin={isEditable}
                pageState={investibleAddState}
                pageStateUpdate={updateInvestibleAddState}
                pageStateReset={investibleAddStateReset}
                parentCommentId={inlineMarketId ? undefined: id}
              />
            </div>
          )}
          {!inlineMarketId && investibleAddBeingEdited && (
            <div style={{marginTop: '2rem'}} />
          )}
          {repliesExpanded && getDecision(inlineMarketId)}
        </>
      </Card>
    </div>
  );
}

Comment.propTypes = {
  allowedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  comment: PropTypes.object.isRequired,
  noAuthor: PropTypes.bool,
  readOnly: PropTypes.bool,
  onDone: PropTypes.func,
  comments: PropTypes.arrayOf(PropTypes.object).isRequired,
  depth: () => {
    // TODO error
    //return new Error('depth is deprecated')
    return null;
  },
  marketId: PropTypes.string.isRequired
};

Comment.defaultProps = {
  noAuthor: false,
  readOnly: false,
  onDone: () => {}
};

function InitialReply(props) {
  const { comment, enableEditing, messages } = props;

  return <Reply id={`c${comment.id}`} comment={comment} enableEditing={enableEditing}
  messages={messages}/>;
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
        padding: 0,
        paddingTop: 8,
        "&:last-child": {
          paddingBottom: 8
        }
      },
      cardActions: {
        marginLeft: theme.spacing(3),
        padding: 0
      },
      cardActionsYellow: {
        marginLeft: theme.spacing(3),
        boxShadow: "10px 5px 5px yellow",
        padding: 0
      },
      cardActionsRed: {
        marginLeft: theme.spacing(3),
        boxShadow: "10px 5px 5px red",
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
        marginBottom: '1.5rem',
        overflow: 'unset'
      },
      containerYellow: {
        marginBottom: '1.5rem',
        boxShadow: '10px 5px 5px yellow',
        overflow: 'unset'
      },
      containerRed: {
        marginBottom: '1.5rem',
        boxShadow: '10px 5px 5px red',
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
  const { comment, messages, enableEditing } = props
  const history = useHistory();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const marketId = useMarketId()
  const presences = usePresences(marketId);
  const commenter = useCommenter(comment, presences) || unknownPresence;
  const [marketsState] = useContext(MarketsContext);
  const [messagesState] = useContext(NotificationsContext);
  const myMessage = findMessageForCommentId(comment.id, messagesState) || {};
  const userId = getMyUserForMarket(marketsState, marketId) || {};
  const isEditable = comment.created_by === userId;
  const classes = useReplyStyles();
  const [replyAddStateFull, replyAddDispatch] = usePageStateReducer('replyAdd');
  const [replyAddState, updateReplyAddState, replyAddStateReset] =
    getPageReducerPage(replyAddStateFull, replyAddDispatch, comment.id);
  const {
    replyBeingEdited,
  } = replyAddState;
  const [editStateFull, editDispatch] = usePageStateReducer('commentEdit');
  const [editState, updateEditState, editStateReset] = getPageReducerPage(editStateFull, editDispatch, comment.id);
  const {
    beingEdited,
  } = editState;

  function handleEditClick() {
    updateEditState({beingEdited: true});
  }

  function setBeingEdited(value, event) {
    if (mobileLayout || invalidEditEvent(event, history)) {
      return;
    }
    handleEditClick();
  }

  function setReplyOpen(isOpen) {
    updateReplyAddState({replyBeingEdited: isOpen});
  }
  const { level: myHighlightedLevel, is_highlighted: isHighlighted } = myMessage;
  const intl = useIntl();
  return (
    <Card className={!(myHighlightedLevel && isHighlighted) ? classes.container : myMessage.level === 'RED'
      ? classes.containerRed : classes.containerYellow}
    >
      <CardContent className={classes.cardContent}>
        <Typography className={classes.commenter} variant="body2">
          {commenter.name}
        </Typography>
        <Typography className={classes.timeElapsed} variant="body2">
          <UsefulRelativeTime
            value={comment.created_at}
          />
        </Typography>
        {beingEdited && (
          <CommentEdit
            intl={intl}
            marketId={marketId}
            editState={editState}
            updateEditState={updateEditState}
            editStateReset={editStateReset}
            comment={comment}
            messages={messages}
          />
        )}
        {!beingEdited && (
          <ReadOnlyQuillEditor
            className={classes.editor}
            value={comment.body}
            setBeingEdited={setBeingEdited}
            isEditable={!mobileLayout && enableEditing && isEditable}
          />
        )}
      </CardContent>
      {!beingEdited && (
        <CardActions className={!(myHighlightedLevel && isHighlighted) ? classes.cardActions : myMessage.level === 'RED'
          ? classes.cardActionsRed : classes.cardActionsYellow}>
          <Typography className={classes.timePosted} variant="body2">
            <FormattedDate value={comment.created_at} />
          </Typography>
          {enableEditing && (
            <Button
              className={classes.action}
              onClick={() => setReplyOpen(true)}
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
      <div className={classes.replyContainer}>
        {replyBeingEdited && marketId && comment && (
          <CommentAdd
            marketId={marketId}
            parent={comment}
            onSave={() => setReplyOpen(false)}
            onCancel={() => setReplyOpen(false)}
            type={REPLY_TYPE}
            commentAddState={replyAddState}
            updateCommentAddState={updateReplyAddState}
            commentAddStateReset={replyAddStateReset}
          />
        )}
      </div>
      {comment.children !== undefined && (
        <CardContent className={classes.cardContent}>
          <ThreadedReplies
            replies={comment.children}
            enableEditing={enableEditing}
          />
        </CardContent>
      )}
    </Card>
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
  const { replies: replyIds, enableEditing, messages } = props;
  const comments = useComments();

  const classes = useThreadedReplyStyles();

  const replies = (replyIds || []).map(replyId => {
    return comments.find(comment => comment.id === replyId);
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
            />
          );
        }
        return React.Fragment;
      })}
    </ol>
  );
}

function ThreadedReply(props) {
  const { comment, enableEditing, messages } = props;
  return <Reply key={`c${comment.id}`} id={`c${comment.id}`} className={props.className} comment={comment}
                enableEditing={enableEditing} messages={messages} />;
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
 * @param {string} marketId
 * @returns {Presence[]}
 */
function usePresences(marketId) {
  const [presencesState] = useContext(MarketPresencesContext);
  return getMarketPresences(presencesState, marketId) || [];
}

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
