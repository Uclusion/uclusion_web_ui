import React, { useContext } from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Button, Card, CardActions, CardContent, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import _ from 'lodash';
import ReadOnlyQuillEditor from '../TextEditors/ReadOnlyQuillEditor';
import CommentAdd from './CommentAdd';
import { ISSUE_TYPE, REPLY_TYPE, REPORT_TYPE, TODO_TYPE, } from '../../constants/comments';
import { removeComment, updateComment } from '../../api/comments';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { usePresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import CommentEdit from './CommentEdit';
import { addMarketComments, getCommentRoot } from '../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import UsefulRelativeTime from '../TextFields/UseRelativeTime';
import { formCommentLink, navigate } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { handleAcceptSuggestion } from '../../utils/commentFunctions';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { findMessageForCommentId, removeMessagesForCommentId } from '../../utils/messageUtils';
import { invalidEditEvent } from '../../utils/windowUtils';
import { Delete } from '@material-ui/icons';
import TooltipIconButton from '../Buttons/TooltipIconButton';
import { getPageReducerPage, usePageStateReducer } from '../PageState/pageStateHooks';
import { ScrollContext } from '../../contexts/ScrollContext';
import ListAltIcon from '@material-ui/icons/ListAlt';
import { LocalCommentsContext, navigateEditReplyBack } from './Comment';

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
        marginLeft: "6px",
        [theme.breakpoints.down('sm')]: {
          marginLeft: '3px',
        }
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

function Reply(props) {
  const { comment, enableEditing, replyEditId, inboxMessageId, isInbox, wizardProps } = props;
  const history = useHistory();
  const myParams = new URL(document.location).searchParams;
  const replyBeingEdited = replyEditId === comment.id &&
    ((myParams && !_.isEmpty(myParams.get('reply'))) || isInbox);
  const beingEdited = replyEditId === comment.id && !replyBeingEdited;
  const isFromInbox = myParams && !_.isEmpty(myParams.get('inbox'));
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const marketId = useMarketId();
  const presences = usePresences(marketId);
  const commenter = useCommenter(comment, presences) || { name: "unknown", email: "" };
  const [hashFragment, noHighlightId, setNoHighlightId] = useContext(ScrollContext);
  const [messagesState] = useContext(NotificationsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const myMessage = findMessageForCommentId(comment.id, messagesState) || {};
  const myPresence = presences.find(presence => presence.current_user) || {};
  const userId = myPresence?.id;
  const isEditable = comment.created_by === userId;
  const classes = useReplyStyles();
  const [replyAddStateFull, replyAddDispatch] = usePageStateReducer('replyAdd');
  const [replyAddState, updateReplyAddState, replyAddStateReset] =
    getPageReducerPage(replyAddStateFull, replyAddDispatch, comment.id);
  const [editStateFull, editDispatch] = usePageStateReducer('commentEdit');
  const [editState, updateEditState, editStateReset] = getPageReducerPage(editStateFull, editDispatch, comment.id);
  const rootComment = getCommentRoot(commentsState, marketId, comment.id);
  const { investible_id: investibleId, group_id: groupId } = comment || {};
  const showConvert = investibleId && [REPORT_TYPE, TODO_TYPE, ISSUE_TYPE].includes(rootComment?.comment_type)
    && !isInbox;

  function useMarketId() {
    return React.useContext(LocalCommentsContext).marketId;
  }

  function handleEditClick() {
    navigateEditReplyBack(history, comment.id, marketId, groupId, investibleId, replyEditId, false, isFromInbox,
      setNoHighlightId);
  }

  function myAccept () {
    setOperationRunning(true);
    return updateComment({marketId, commentId: comment.id, commentType: TODO_TYPE}).then((comment) => {
      handleAcceptSuggestion({ isMove: false, comment, commentsState, commentsDispatch, messagesState });
      setOperationRunning(false);
      navigate(history, formCommentLink(marketId, groupId, investibleId, comment.id));
    })
  }

  function remove() {
    setOperationRunning(true);
    return removeComment(marketId, comment.id)
      .then((comment) => {
        addMarketComments(commentsDispatch, marketId, [comment]);
        removeMessagesForCommentId(comment.id, messagesState);
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
    navigateEditReplyBack(history, comment.id, marketId, groupId, investibleId, replyEditId, true, isFromInbox,
      setNoHighlightId);
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

  if (!marketId) {
    return React.Fragment;
  }

  return (
    <>
      <Card className={getHighlightClass()} id={`${isInbox ? 'inbox' : ''}c${comment.id}`}>
        <div onClick={() => {
          if (isInbox && (!replyBeingEdited || beingEdited)) {
            navigate(history, formCommentLink(marketId, groupId, investibleId, comment.id));
          }
        }}>
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
            {showConvert && (
              <TooltipIconButton
                disabled={operationRunning !== false}
                onClick={myAccept}
                icon={<ListAltIcon fontSize={mobileLayout ? 'small' : undefined} />}
                size={mobileLayout ? 'small' : undefined}
                translationId="wizardAcceptLabel"
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
                messages={!_.isEmpty(myMessage) ? [myMessage] : []}
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
        </div>
      </Card>
      <div className={classes.replyContainer}>
        {replyBeingEdited && marketId && comment && (
          <CommentAdd
            marketId={marketId}
            groupId={groupId}
            parent={comment}
            onSave={() => setReplyOpen()}
            onCancel={() => setReplyOpen()}
            type={REPLY_TYPE}
            commentAddState={replyAddState}
            updateCommentAddState={updateReplyAddState}
            commentAddStateReset={replyAddStateReset}
            threadMessages={myMessage ? [myMessage] : []}
            nameDifferentiator="reply"
            wizardProps={wizardProps}
          />
        )}
        {comment.children !== undefined && (
          <div className={classes.cardContent}>
            <ThreadedReplies
              replies={comment.children}
              enableEditing={enableEditing}
              replyEditId={replyEditId}
              isInbox={isInbox}
              wizardProps={wizardProps}
            />
          </div>
        )}
      </div>
    </>
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
  const { replies: replyIds, enableEditing, replyEditId, isInbox, wizardProps } = props;

  const comments = React.useContext(LocalCommentsContext).comments;
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
              replyEditId={replyEditId}
              isInbox={isInbox}
              wizardProps={wizardProps}
            />
          );
        }
        return React.Fragment;
      })}
    </ol>
  );
}

function ThreadedReply(props) {
  const { comment, enableEditing, messages, replyEditId, isInbox, wizardProps } = props;
  return <Reply key={`c${comment.id}`} id={`c${comment.id}`} className={props.className} comment={comment}
                enableEditing={enableEditing} messages={messages} replyEditId={replyEditId}
                isInbox={isInbox} wizardProps={wizardProps} />;
}

function useCommenter(comment, presences) {
  return presences.find(presence => presence.id === comment.created_by);
}

export default Reply;
