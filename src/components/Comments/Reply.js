import React, { useContext } from 'react';
import { FormattedDate, FormattedMessage, useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Button, Card, CardActions, CardContent, Typography, useMediaQuery, useTheme } from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import _ from 'lodash';
import ReadOnlyQuillEditor from '../TextEditors/ReadOnlyQuillEditor';
import { ISSUE_TYPE, REPORT_TYPE, TODO_TYPE, } from '../../constants/comments';
import { removeComment } from '../../api/comments';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { usePresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { addMarketComments, getCommentRoot } from '../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import UsefulRelativeTime from '../TextFields/UseRelativeTime';
import {
  decomposeMarketPath,
  formCommentLink,
  formMarketAddInvestibleLink,
  formWizardLink,
  navigate,
  preventDefaultAndProp
} from '../../utils/marketIdPathFunctions';
import { useHistory, useLocation } from 'react-router';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { findMessageForCommentId, removeMessagesForCommentId } from '../../utils/messageUtils';
import { invalidEditEvent } from '../../utils/windowUtils';
import TooltipIconButton from '../Buttons/TooltipIconButton';
import { ScrollContext } from '../../contexts/ScrollContext';
import ListAltIcon from '@material-ui/icons/ListAlt';
import { LocalCommentsContext, useCommentStyles } from './Comment';
import { stripHTML } from '../../utils/stringFunctions';
import Gravatar from '../Avatars/Gravatar';
import NotificationDeletion from '../../pages/Home/YourWork/NotificationDeletion';
import { BUG_WIZARD_TYPE, REPLY_WIZARD_TYPE } from '../../constants/markets';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';

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
        paddingTop: 0,
        paddingRight: 0,
        paddingLeft: 0,
        paddingBottom: "0.5rem",
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
        marginRight: "8px",
        paddingBottom: '0.5rem'
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
      containerLink: {
        marginTop: '1.5rem',
        marginRight: '0.25rem',
        overflow: 'unset',
        cursor: 'pointer'
      },
      containerBlueLink: {
        boxShadow: "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px blue",
        overflow: 'unset',
        marginTop: "1.5rem",
        marginRight: '0.25rem',
        paddingRight: '0.5rem',
        cursor: 'pointer'
      },
      containerBlueLinkCompressed: {
        boxShadow: "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px blue",
        overflow: 'unset',
        marginRight: '0.25rem',
        paddingRight: '0.5rem',
        paddingTop: '1rem',
        cursor: 'pointer'
      },
      containerYellow: {
        marginTop: '1.5rem',
        boxShadow: "0px 3px 3px -2px rgba(0,0,0,0.2),0px 3px 4px 0px rgba(0,0,0,0.14),0px 1px 8px 0px blue",
        marginRight: '0.25rem',
        paddingRight: '0.5rem',
        overflow: 'unset'
      },
      containerHashYellow: {
        marginTop: '1.5rem',
        backgroundColor: "#FBF6D8",
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
  const { comment, enableEditing, replyEditId, inboxMessageId, isInbox, wizardProps, useCompression,
    toggleCompression } = props;
  const history = useHistory();
  const location = useLocation();
  const replyBeingEdited = replyEditId === comment.id && isInbox;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const marketId = useMarketId();
  const idPrepend = usePrependId();
  const presences = usePresences(marketId);
  const commenter = useCommenter(comment, presences) || { name: "unknown", email: "" };
  const [hashFragment, noHighlightId, setNoHighlightId] = useContext(ScrollContext);
  const [messagesState] = useContext(NotificationsContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const { pathname } = location;
  const { marketId: typeObjectIdRaw, action } = decomposeMarketPath(pathname);
  const typeObjectId = action === 'inbox' ? typeObjectIdRaw : undefined;
  const myMessage = findMessageForCommentId(comment.id, messagesState) || {};
  const myPresence = presences.find(presence => presence.current_user) || {};
  const userId = myPresence?.id;
  const isEditable = comment.created_by === userId;
  const classes = useReplyStyles();
  const commentClasses = useCommentStyles();
  const rootComment = getCommentRoot(commentsState, marketId, comment.id);
  const { investible_id: investibleId, group_id: groupId } = comment || {};
  const showConvert = investibleId && [REPORT_TYPE, TODO_TYPE, ISSUE_TYPE].includes(rootComment?.comment_type)
    && !isInbox;

  function useMarketId() {
    return React.useContext(LocalCommentsContext).marketId;
  }

  function usePrependId() {
    return React.useContext(LocalCommentsContext).idPrepend;
  }

  function handleEditClick() {
    const id = comment.id;
    if (replyEditId) {
      navigate(history, formCommentLink(marketId, groupId, investibleId, id));
    } else {
      setNoHighlightId(id);
      navigate(history, `/comment/${marketId}/${id}`, false, true);
    }
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
    navigate(history, formWizardLink(REPLY_WIZARD_TYPE, marketId, undefined, undefined, comment.id,
      typeObjectId));
  }
  const { level: myHighlightedLevel } = myMessage;
  const isLinkedTo = noHighlightId !== comment.id && hashFragment?.includes(comment.id);
  const isHighlighted = myHighlightedLevel || isLinkedTo;
  const intl = useIntl();
  function getHighlightClass() {
    if (isInbox) {
      if (inboxMessageId) {
        if (inboxMessageId === comment.id) {
          if (useCompression) {
            return classes.containerBlueLinkCompressed;
          }
          return classes.containerBlueLink;
        }
      }
      return classes.containerLink;
    }
    if (isLinkedTo) {
      return classes.containerHashYellow;
    }
    return !isHighlighted ? classes.container : (myMessage.level === 'RED' ? classes.containerRed :
      classes.containerYellow);
  }

  if (!marketId) {
    return React.Fragment;
  }

  const compressedCommentCard = <Card elevation={3} style={{
    display: 'flex', paddingBottom: '0.25rem', paddingLeft: '0.5rem',
    paddingTop: '1rem', paddingRight: '0.5rem', cursor: 'pointer'
  }} onClick={toggleCompression}>
    <Gravatar name={commenter.name} email={commenter.email} className={commentClasses.smallGravatar}/>
    <div className={commentClasses.compressedComment}>{stripHTML(comment.body)}</div>
    <div style={{ flexGrow: 1 }}/>
    <div style={{ marginRight: '1rem' }}>
      <TooltipIconButton
        icon={<ExpandMoreIcon />}
        size="small"
        noPadding
        translationId="rowExpandComment"
      />
    </div>
  </Card>;

  const commentCard = <Card className={getHighlightClass()}
                            style={{width: !enableEditing ? 'fit-content' : undefined, paddingRight: '1rem'}}
                            id={`${isInbox ? 'inbox' : ''}${idPrepend}${comment.id}`}>
    <div onClick={() => {
      if (replyBeingEdited || isInbox) {
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
        {(myPresence.is_admin || isEditable) && enableEditing && (
          <TooltipIconButton
            disabled={operationRunning !== false}
            onClick={remove}
            icon={<NotificationDeletion height={22} width={22} isRed />}
            size='small'
            translationId="commentRemoveLabel"
            doFloatRight
          />
        )}
        {showConvert && (
          <TooltipIconButton
            disabled={operationRunning !== false}
            onClick={() => navigate(history,
              `${formMarketAddInvestibleLink(marketId, groupId, undefined, undefined,
                BUG_WIZARD_TYPE)}&fromCommentId=${comment.id}`)}
            icon={<ListAltIcon fontSize='small' />}
            size='small'
            translationId="wizardAcceptLabel"
            doFloatRight
          />
        )}
        {showConvert && (
          <div style={{marginRight: '1rem'}} />
        )}
        {!_.isEmpty(comment) && (
          <ReadOnlyQuillEditor
            className={classes.editor}
            value={comment.body}
            id={comment.id}
            setBeingEdited={setBeingEdited}
            isEditable={!mobileLayout && enableEditing && isEditable}
          />
        )}
      </CardContent>
      <CardActions className={classes.cardActions}>
        <Typography className={classes.timePosted} variant="body2">
          <FormattedDate value={comment.created_at} />
        </Typography>
        {enableEditing && (
          <Button
            className={classes.action}
            id={`commentReplyButton${comment.id}`}
            onClick={(event) => {
              preventDefaultAndProp(event);
              setReplyOpen();
            }}
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
    </div>
  </Card>;

  if (useCompression && comment.id !== inboxMessageId) {
    return (
      <>
        {compressedCommentCard}
        <div className={classes.cardContent}>
          <ThreadedReplies
            replies={comment.children}
            enableEditing={enableEditing}
            replyEditId={replyEditId}
            isInbox={isInbox}
            useCompression={useCompression}
            inboxMessageId={inboxMessageId}
            wizardProps={wizardProps}
          />
        </div>
      </>
    );
  }

  return (
    <>
      {commentCard}
      <div className={classes.replyContainer}>
        {comment.children !== undefined && (
          <div className={classes.cardContent}>
            <ThreadedReplies
              replies={comment.children}
              enableEditing={enableEditing}
              replyEditId={replyEditId}
              isInbox={isInbox}
              inboxMessageId={inboxMessageId}
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
  const { replies: replyIds, enableEditing, replyEditId, isInbox, wizardProps, useCompression,
    inboxMessageId} = props;

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
  if (useCompression) {
    const notifiedComment = comments.find((aComment) => aComment.id === inboxMessageId);
    return (
      <ol className={classes.container}>
        {sortedReplies.map((reply) => {
          if (reply) {
            if (reply.reply_id !== notifiedComment.reply_id || reply.id === inboxMessageId) {
              return (
                <ThreadedReply
                  className={classes.visible}
                  comment={reply}
                  key={`threadc${reply.id}`}
                  enableEditing={enableEditing}
                  replyEditId={replyEditId}
                  isInbox={isInbox}
                  inboxMessageId={inboxMessageId}
                  wizardProps={wizardProps}
                />
              );
            }
          }
          return React.Fragment;
        })}
      </ol>
    );
  }

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
              inboxMessageId={inboxMessageId}
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
  const { comment, enableEditing, messages, replyEditId, isInbox, inboxMessageId, wizardProps } = props;
  return <Reply key={`c${comment.id}`} id={`c${comment.id}`} className={props.className} comment={comment}
                enableEditing={enableEditing} messages={messages} replyEditId={replyEditId}
                isInbox={isInbox} inboxMessageId={inboxMessageId} wizardProps={wizardProps} />;
}

function useCommenter(comment, presences) {
  return presences.find(presence => presence.id === comment.created_by);
}

export default Reply;
