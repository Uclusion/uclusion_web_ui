import React, { useContext, useEffect, useState } from 'react'
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
  Typography
} from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import clsx from 'clsx'
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
import { VersionsContext } from '../../contexts/VersionsContext/VersionsContext'
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
import { useHistory, useLocation } from 'react-router'
import { createInitiative, updateMarket } from '../../api/markets'
import { addDecisionInvestible } from '../../api/investibles'
import YourVoting from '../../pages/Investible/Voting/YourVoting'
import Voting from '../../pages/Investible/Decision/Voting'
import ShareStoryButton from '../../pages/Investible/Planning/ShareStoryButton'
import { onCommentOpen } from '../../utils/commentFunctions'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { findMessageForCommentId } from '../../utils/messageUtils'
import GravatarAndName from '../Avatars/GravatarAndName';
import { invalidEditEvent, isTinyWindow } from '../../utils/windowUtils'
import localforage from 'localforage'
import DecisionInvestibleAdd from '../../pages/Dialog/Decision/DecisionInvestibleAdd'
import ExpandableAction from '../SidebarActions/Planning/ExpandableAction'
import AddIcon from '@material-ui/icons/Add'
import { deleteOrDehilightMessages } from '../../api/users'
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton'
import { Clear, Delete, Done, Edit, Eject, ExpandLess, ExpandMore, SettingsBackupRestore } from '@material-ui/icons'
import ReplyIcon from '@material-ui/icons/Reply'
import TooltipIconButton from '../Buttons/TooltipIconButton'

const useCommentStyles = makeStyles(
  theme => {
    return {
      chip: {
        margin: 0,
        marginBottom: 18
      },
      content: {
        marginTop: "12px",
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
        fontWeight: 'bold'
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
  const { comment, marketId, comments, allowedTypes, editOpenDefault, noAuthor, onDone,  readOnly } = props;
  const history = useHistory();
  const location = useLocation();
  const { hash } = location;
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const intl = useIntl();
  const classes = useCommentStyles();
  const { id, comment_type: commentType, investible_id: investibleId, inline_market_id: inlineMarketId,
  created_by: commentCreatedBy, resolved, notification_type: myNotificationType, creation_stage_id: createdStageId,
  mentions } = comment;
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
  const userId = getMyUserForMarket(marketsState, marketId) || {};
  const activeMarket = marketStage === ACTIVE_STAGE;
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const inArchives = !activeMarket || !myPresence.following;
  const replies = comments.filter(comment => comment.reply_id === id);
  const sortedReplies = _.sortBy(replies, "created_at");
  const [expandedCommentState, expandedCommentDispatch] = useContext(ExpandedCommentContext);
  const [replyOpen, setReplyOpen] = useState(false);
  const [inlineInvestibleAdd, setInlineInvestibleAdd] = useState(false);
  const [editOpen, setEditOpen] = useState(editOpenDefault);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const [marketPresencesState, presenceDispatch] = useContext(MarketPresencesContext);
  const [investiblesState, investiblesDispatch] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const enableActions = !inArchives && !readOnly;
  const enableEditing = !inArchives && !resolved && !readOnly; //resolved comments or those in archive aren't editable
  const [storedState, setStoredState] = useState(undefined);
  const [idLoaded, setIdLoaded] = useState(undefined);

  function toggleInlineInvestibleAdd() {
    setInlineInvestibleAdd(!inlineInvestibleAdd);
  }

  function toggleMultiVote() {
    const myMultiVote = !multiVote;
    setMultiVote(myMultiVote);
    if (myMultiVote !== originalAllowMultiVote) {
      return updateMarket(inlineMarketId, null, null, null, null,
        null, null, null, myMultiVote)
        .then((market) => {
          addMarketToStorage(marketsDispatch, undefined, market);
        });
    }
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
        const { market: { id: inlineMarketId }, parent } = result;
        addCommentToMarket(parent, commentState, commentDispatch);
        const addInfo = {
          marketId: inlineMarketId,
          description: 'NA',
          name: 'NA',
        };
        return addDecisionInvestible(addInfo).then((investible) => {
          addInvestible(investiblesDispatch, () => {}, investible);
          setOperationRunning(false);
        });
      });
  }

  function toggleReply() {
    setReplyOpen(!replyOpen);
  }

  function toggleEdit() {
    if (editOpen) {
      onDone();
    }
    setEditOpen(!editOpen);
  }

  function setBeingEdited(value, event) {
    if (isTinyWindow() || invalidEditEvent(event)) {
      return;
    }
    setEditOpen(value);
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

  function getDialog(anInlineMarket) {
    const inlineInvestibles = getMarketInvestibles(investiblesState, anInlineMarket.id) || [];
    const anInlineMarketInvestibleComments = getMarketComments(commentsState, anInlineMarket.id) || [];
    const anInlineMarketPresences = getMarketPresences(marketPresencesState, anInlineMarket.id) || [];
    const underConsiderationStage = getInCurrentVotingStage(marketStagesState, anInlineMarket.id);
    const underConsideration = getInlineInvestiblesForStage(underConsiderationStage, inlineInvestibles);
    const proposedStage = getProposedOptionsStage(marketStagesState, anInlineMarket.id);
    const proposed = getInlineInvestiblesForStage(proposedStage, inlineInvestibles);
    return (
      <>
        <Grid item xs={12} style={{marginTop: '1rem'}}>
          <SubSection
            id="currentVoting"
            type={SECTION_TYPE_SECONDARY}
            title={intl.formatMessage({ id: 'decisionDialogCurrentVotingLabel' })}
            actionButton={ inArchives ? null :
              (<ExpandableAction
                icon={<AddIcon htmlColor="black"/>}
                label={intl.formatMessage({ id: 'createDialogApprovableExplanation' })}
                openLabel={intl.formatMessage({ id: 'decisionDialogAddInvestibleLabel'})}
                onClick={toggleInlineInvestibleAdd}
                disabled={commentCreatedBy !== userId}
                tipPlacement="top-end"
              />)}
          >
            <CurrentVoting
              marketPresences={anInlineMarketPresences}
              investibles={underConsideration}
              marketId={anInlineMarket.id}
              comments={anInlineMarketInvestibleComments}
              inArchives={inArchives}
              isAdmin={commentCreatedBy === userId}
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
                disabled={commentCreatedBy === userId}
                tipPlacement="top-end"
              />)}
          >
            <ProposedIdeas
              investibles={proposed}
              marketId={anInlineMarket.id}
              comments={anInlineMarketInvestibleComments}
              isAdmin={commentCreatedBy === userId}
            />
          </SubSection>
        </Grid>
      </>
    );
  }

  function getInitiative(anInlineMarket) {
    const anInlineMarketPresences = getMarketPresences(marketPresencesState, anInlineMarket.id) || [];
    const myInlinePresence = anInlineMarketPresences.find((presence) => presence.current_user);
    const isAdmin = myInlinePresence && myInlinePresence.is_admin;
    const inlineInvestibles = getMarketInvestibles(investiblesState, anInlineMarket.id) || [];
    const [fullInlineInvestible] = inlineInvestibles;
    const inlineInvestibleId = fullInlineInvestible ? fullInlineInvestible.investible.id : undefined;
    const comments = getMarketComments(commentsState, anInlineMarket.id);
    const investibleComments = comments.filter((comment) => comment.investible_id === inlineInvestibleId);
    const investmentReasons = investibleComments.filter((comment) => comment.comment_type === JUSTIFY_TYPE);
    const positiveVoters = anInlineMarketPresences.filter((presence) => {
      const { investments } = presence
      const negInvestment = (investments || []).find((investment) => {
        const { quantity } = investment
        return quantity > 0
      })
      return !_.isEmpty(negInvestment)
    });
    const negativeVoters = anInlineMarketPresences.filter((presence) => {
      const { investments } = presence;
      const negInvestment = (investments || []).find((investment) => {
        const { quantity } = investment;
        return quantity < 0;
      });
      return !_.isEmpty(negInvestment);
    });
    return (
      <div style={{paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '0.5rem'}}>
        {!isAdmin && (
          <YourVoting
            investibleId={inlineInvestibleId}
            marketPresences={anInlineMarketPresences}
            comments={investmentReasons}
            userId={inlineUserId}
            market={anInlineMarket}
          />
        )}
        <h2>
          <FormattedMessage id="initiativeVotingFor"/>
        </h2>
        <Voting
          investibleId={inlineInvestibleId}
          marketPresences={positiveVoters}
          investmentReasons={investmentReasons}
        />
        <h2>
          <FormattedMessage id="initiativeVotingAgainst" />
        </h2>
        <Voting
          investibleId={inlineInvestibleId}
          marketPresences={negativeVoters}
          investmentReasons={investmentReasons}
        />
        </div>
    );
  }

  function getDecision(aMarketId) {
    const anInlineMarket = getMarket(marketsState, aMarketId);
    if (!anInlineMarket) {
      return React.Fragment;
    }
    const { parent_comment_id: parentCommentId, market_type: marketType } = anInlineMarket;
    if (!parentCommentId) {
      return React.Fragment;
    }
    if (marketType === INITIATIVE_TYPE) {
      return getInitiative(anInlineMarket);
    }
    return getDialog(anInlineMarket);
  }

  function reopen() {
    setOperationRunning(true);
    return reopenComment(marketId, id)
      .then((comment) => {
        onCommentOpen(investiblesState, investibleId, marketStagesState, marketId, comment, investiblesDispatch,
          commentsState, commentsDispatch, versionsDispatch);
        setOperationRunning(false);
        onDone();
      });
  }
  function remove() {
    setOperationRunning(true);
    return removeComment(marketId, id)
      .then(() => {
        removeComments(commentsDispatch, marketId, [id]);
        setOperationRunning(false);
        onDone();
      });
  }
  function resolve() {
    setOperationRunning(true);
    return resolveComment(marketId, id)
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentsDispatch, versionsDispatch);
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
  const myHighlightedState = myMessage || {};
  const myExpandedState = expandedCommentState[id] || {};
  const { level: myHighlightedLevel, is_highlighted: isHighlighted } = myHighlightedState;
  if (isHighlighted) {
    messages.push(myMessage);
  }
  const { expanded: myRepliesExpanded } = myExpandedState;
  const repliesExpanded = myRepliesExpanded === undefined ? !comment.resolved : myRepliesExpanded;
  const isInReview = createdStageId === (getInReviewStage(marketStagesState, marketId) || {id: 'fake'}).id;
  const overrideLabel = (marketType === PLANNING_TYPE && commentType === REPORT_TYPE && isInReview) ?
    <FormattedMessage id="reviewReportPresent" /> : undefined;

  const displayUpdatedBy = updatedBy !== undefined && comment.updated_by !== comment.created_by;

  useEffect(() => {
    if (!repliesExpanded && hash && !_.isEmpty(highlighted)) {
      if (highlighted.find((anId) => hash.includes(anId))) {
        expandedCommentDispatch({ type: EXPANDED_CONTROL, commentId: id, expanded: true });
      }
    }
    return () => {};
  }, [expandedCommentDispatch, hash, highlighted, id, repliesExpanded]);

  useEffect(() => {
    if (inlineInvestibleAdd) {
      localforage.getItem(`add_investible_${id}`).then((stateFromDisk) => {
        setStoredState(stateFromDisk || {});
        setIdLoaded(id);
      });
    }
    if (!inlineInvestibleAdd) {
      setIdLoaded(undefined);
    }
  }, [inlineInvestibleAdd, id]);

  const showActions = !replyOpen || replies.length > 0;
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

  const isEditable = comment.created_by === userId;
  const displayEditing = enableEditing && isEditable && !editOpenDefault;
  const inReviewStageId = (getInReviewStage(marketStagesState, marketId) || {}).id;
  return (
    <Card className={getCommentHighlightStyle()} elevation={3}>
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
        {displayEditing && isTinyWindow() && (
          <SpinningIconLabelButton
            onClick={toggleEdit}
            doSpin={false}
            icon={Edit}
          >
            <FormattedMessage id="edit" />
          </SpinningIconLabelButton>
        )}
        {commentType !== JUSTIFY_TYPE && commentType !== REPLY_TYPE && (
          <div style={{marginRight: '1rem', marginTop: '0.5rem'}}>
            <ShareStoryButton commentId={id} commentType={commentType} investibleId={investibleId} />
          </div>
        )}
        {(myPresence.is_admin || isEditable) && enableActions && (commentType === REPORT_TYPE || resolved) && (
          <div style={{marginRight: '2rem', marginTop: '0.5rem'}}>
            <TooltipIconButton
              disabled={operationRunning}
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
            key={userId}
            email={createdBy.email}
            name={createdBy.name}
            typographyVariant="caption"
            typographyClassName={classes.createdBy}
            />
        )}
        <Box marginTop={1}>
          {!editOpen && (
            <ReadOnlyQuillEditor value={comment.body} setBeingEdited={setBeingEdited}
                                 isEditable={!isTinyWindow() && displayEditing}/>
          )}
          {editOpen && (
            <CommentEdit
              marketId={marketId}
              comment={comment}
              onSave={toggleEdit}
              onCancel={toggleEdit}
              allowedTypes={allowedTypes}
              myNotificationType={myNotificationType}
              isInReview={isInReview}
            />
          )}
          {noAuthor && !editOpen && (
            <SpinningIconLabelButton onClick={onDone} doSpin={false} icon={Clear}>
              {intl.formatMessage({ id: 'cancel' })}
            </SpinningIconLabelButton>
          )}
        </Box>
      </CardContent>
      {showActions && (
          <CardActions>
            <div className={classes.actions}>
              {investibleId && commentType === REPORT_TYPE && (
                <div style={{marginLeft: '1rem', paddingTop: '0.5rem'}}>
                  <FormControlLabel
                    control={<Checkbox
                      style={{maxHeight: '1rem'}}
                      id="notifyAll"
                      name="notifyAll"
                      checked={myNotificationType === 'YELLOW'}
                      disabled={true}
                    />}
                    label={intl.formatMessage({ id: "notifyAll" })}
                  />
                </div>
              )}
              {commentType === QUESTION_TYPE && !inArchives && !inlineMarketId && marketType === PLANNING_TYPE && (
                <SpinningIconLabelButton
                  disabled={commentCreatedBy !== userId}
                  onClick={toggleInlineInvestibleAdd}
                  doSpin={false}
                  icon={AddIcon}
                >
                  {intl.formatMessage({ id: "inlineAddLabel" })}
                </SpinningIconLabelButton>
              )}
              {commentType === SUGGEST_CHANGE_TYPE && !inArchives && !resolved && !inlineMarketId && marketType === PLANNING_TYPE && (
                <div style={{marginLeft: '1rem', marginRight: '0.5rem', paddingTop: '0.25rem'}}>
                  <Typography>
                    {intl.formatMessage({ id: 'allowVoteSuggestion' })}
                    <Checkbox
                      style={{maxHeight: '1rem'}}
                      id="suggestionVote"
                      name="suggestionVote"
                      checked={!_.isEmpty(inlineMarketId)}
                      onChange={allowSuggestionVote}
                      disabled={operationRunning || commentCreatedBy !== userId}
                    />
                  </Typography>
                </div>
              )}
              {(replies.length > 0 || inlineMarketId) && (!isTinyWindow() || !inlineMarketId) && (
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
              {!isTinyWindow() && !_.isEmpty(messages) && (
                <SpinningIconLabelButton onClick={() => {
                  setOperationRunning(true);
                  deleteOrDehilightMessages(messages, messagesDispatch).then(() => setOperationRunning(false))
                    .finally(() => {
                      setOperationRunning(false);
                    });
                }} icon={SettingsBackupRestore}>
                  {intl.formatMessage({ id: 'markRead' })}
                </SpinningIconLabelButton>
              )}
              {enableActions && commentType !== REPORT_TYPE && (!resolved || userId === commentCreatedBy
                || commentType === TODO_TYPE || commentType === ISSUE_TYPE) && (
                <SpinningIconLabelButton
                  onClick={resolved ? reopen : resolve}
                  icon={resolved ? SettingsBackupRestore : Done}
                >
                  {intl.formatMessage({
                    id: resolved ? "commentReopenLabel" : "commentResolveLabel"
                  })}
                </SpinningIconLabelButton>
              )}
              {enableEditing && (
                <React.Fragment>
                  {((commentType !== REPORT_TYPE || createdStageId === inReviewStageId)
                    || (mentions || []).includes(myPresence.id)) && (
                    <SpinningIconLabelButton
                      onClick={toggleReply}
                      icon={ReplyIcon}
                      doSpin={false}
                    >
                      {intl.formatMessage({ id: "commentReplyLabel" })}
                    </SpinningIconLabelButton>
                  )}
                  {createdBy === userId && (
                    <Button
                      className={clsx(classes.action, classes.actionSecondary)}
                      color="primary"
                      disabled={operationRunning}
                      onClick={toggleEdit}
                      variant="contained"
                    >
                      {intl.formatMessage({ id: "commentEditLabel" })}
                    </Button>
                  )}
                </React.Fragment>
              )}
          </div>
          <div className={classes.actionsEnd}>
            {commentType === QUESTION_TYPE && !inArchives && inlineMarketId && !resolved && (
              <div style={{marginRight: '1rem', paddingTop: '0.5rem'}}>
                <Typography style={{fontSize: 12}}>
                  {intl.formatMessage({ id: isTinyWindow() ? 'allowMultiVoteQuestionMobile'
                      : 'allowMultiVoteQuestion' })}
                  <Checkbox
                    style={{maxHeight: '1rem'}}
                    id="multiVote"
                    name="multiVote"
                    checked={multiVote}
                    onChange={toggleMultiVote}
                    disabled={inlineCreatedBy !== inlineUserId}
                  />
                </Typography>
              </div>
            )}
            {!investibleId && !inArchives && enableActions && !resolved && marketType === PLANNING_TYPE && (
              <SpinningIconLabelButton
                onClick={() => navigate(history, `${formMarketAddInvestibleLink(marketId)}#fromCommentId=${id}`)}
                doSpin={false}
                icon={Eject}
              >
                {intl.formatMessage({ id: "storyFromComment" })}
              </SpinningIconLabelButton>
            )}
          </div>
        </CardActions>
      )}
      <CommentAdd
        marketId={marketId}
        hidden={!replyOpen}
        parent={comment}
        onSave={toggleReply}
        onCancel={toggleReply}
        type={REPLY_TYPE}
      />
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
                highLightId={highlighted}
                enableEditing={enableEditing}
              />
            );
          })}
        </LocalCommentsContext.Provider>
      </Box>
      {inlineInvestibleAdd && idLoaded === id && (
        <div style={{marginTop: '2rem'}}>
          <DecisionInvestibleAdd
            marketId={inlineMarketId}
            onSave={(investible) => addInvestible(investiblesDispatch, () => {}, investible)}
            onCancel={toggleInlineInvestibleAdd}
            onSpinComplete={toggleInlineInvestibleAdd}
            isAdmin={commentCreatedBy === userId}
            storedState={storedState}
            parentCommentId={inlineMarketId ? undefined: id}
          />
        </div>
      )}
      {!inlineMarketId && inlineInvestibleAdd && (
        <div style={{marginTop: '2rem'}} />
      )}
      {repliesExpanded && getDecision(inlineMarketId)}
    </Card>
  );
}

Comment.propTypes = {
  allowedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  comment: PropTypes.object.isRequired,
  editOpenDefault: PropTypes.bool,
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
  editOpenDefault: false,
  noAuthor: false,
  readOnly: false,
  onDone: () => {}
};

function InitialReply(props) {
  const { comment, highLightId, enableEditing } = props;

  return <Reply id={`c${comment.id}`} comment={comment} highLightId={highLightId} enableEditing={enableEditing}/>;
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
        marginBottom: '1.5rem'
      },
      containerYellow: {
        marginBottom: '1.5rem',
        boxShadow: "10px 5px 5px yellow"
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
  const { comment, highLightId, enableEditing, ...other } = props;

  const marketId = useMarketId();
  const presences = usePresences(marketId);
  // TODO: these shouldn't be unknown?
  const commenter = useCommenter(comment, presences) || unknownPresence;

  const [marketsState] = useContext(MarketsContext);
  const userId = getMyUserForMarket(marketsState, marketId) || {};
  const isEditable = comment.created_by === userId;

  const classes = useReplyStyles();

  const [editing, setEditing] = React.useState(false);
  function handleEditClick() {
    setEditing(true);
  }

  const [replyOpen, setReplyOpen] = React.useState(false);

  const intl = useIntl();
  return (
    <Card className={highLightId.includes(comment.id) ? classes.containerYellow : classes.container}
      {...other}
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
        {editing ? (
          <CommentEdit
            intl={intl}
            marketId={marketId}
            onSave={() => setEditing(false)}
            onCancel={() => setEditing(false)}
            comment={comment}
          />
        ) : (
          <ReadOnlyQuillEditor
            className={classes.editor}
            value={comment.body}
          />
        )}
      </CardContent>
      <CardActions className={highLightId.includes(comment.id) ? classes.cardActionsYellow : classes.cardActions}>
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
        {enableEditing && isEditable && (
          <Button
            className={classes.action}
            onClick={handleEditClick}
            variant="text"
          >
            <FormattedMessage id="commentEditLabel" />
          </Button>
        )}
      </CardActions>
      <div className={classes.replyContainer}>
        <CommentAdd
          marketId={marketId}
          hidden={!replyOpen}
          parent={comment}
          onSave={() => setReplyOpen(false)}
          onCancel={() => setReplyOpen(false)}
          type={REPLY_TYPE}
        />
      </div>
      {comment.children !== undefined && (
        <CardContent className={classes.cardContent}>
          <ThreadedReplies
            replies={comment.children}
            highLightId={highLightId}
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
  const { replies: replyIds, highLightId, enableEditing } = props;
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
              highLightId={highLightId}
              enableEditing={enableEditing}
            />
          );
        }
        return React.Fragment;
      })}
    </ol>
  );
}

function ThreadedReply(props) {
  const { comment, highLightId, enableEditing } = props;
  return <Reply key={`c${comment.id}`} id={`c${comment.id}`} className={props.className} comment={comment}
                highLightId={highLightId} enableEditing={enableEditing} />;
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
