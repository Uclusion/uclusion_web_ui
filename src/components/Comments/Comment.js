import React, { useContext, useEffect, useState } from "react";
import {
  FormattedDate,
  FormattedMessage,
  FormattedRelativeTime,
  useIntl
} from "react-intl";
import PropTypes from "prop-types";
import {
  Button,
  Box,
  Card,
  CardContent,
  CardActions,
  Typography
} from "@material-ui/core";
import { makeStyles } from "@material-ui/styles";
import clsx from "clsx";
import _ from "lodash";
import ReadOnlyQuillEditor from "../TextEditors/ReadOnlyQuillEditor";
import CommentAdd from "./CommentAdd";
import { REPLY_TYPE } from "../../constants/comments";
import { reopenComment, resolveComment } from "../../api/comments";
import SpinBlockingButton from "../SpinBlocking/SpinBlockingButton";
import { OperationInProgressContext } from "../../contexts/OperationInProgressContext/OperationInProgressContext";
import { MarketPresencesContext } from "../../contexts/MarketPresencesContext/MarketPresencesContext";
import { getMarketPresences } from "../../contexts/MarketPresencesContext/marketPresencesHelper";
import CommentEdit from "./CommentEdit";
import { MarketsContext } from "../../contexts/MarketsContext/MarketsContext";
import { getMyUserForMarket } from "../../contexts/MarketsContext/marketsContextHelper";
import {
  HIGHLIGHT_REMOVE,
  HighlightedCommentContext
} from "../../contexts/HighlightedCommentContext";
import CardType from '../CardType';

const enableEditing = true;

const useCommentStyles = makeStyles(
  {
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
    actions: {
      display: "flex",
      justifyContent: "flex-end",
      boxShadow: "none",
      width: "100%"
    },
    action: {
      boxShadow: "none",
      fontSize: 12,
      padding: "4px 16px",
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
    updatedBy: {
      alignSelf: "baseline",
      color: "#434343",
      fontWeight: "bold",
      fontSize: 12,
      lineHeight: 1.75,
      marginLeft: "auto"
    },
    actionResolveToggle: {
      alignSelf: "baseline",
      margin: "11px 12px 11px 16px"
    },
    actionEdit: {
      alignSelf: "baseline",
      margin: "11px 0px 11px 16px"
    },
    commentType: {
      alignSelf: "start",
      display: "inline-flex"
    },
    createdBy: {
      fontSize: "15px",
      fontWeight: "bold"
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
      boxShadow: "10px 5px 5px red"
    },
    containerYellow: {
      boxShadow: "10px 5px 5px yellow"
    }
  },
  { name: "Comment" }
);

/**
 * @type {React.Context<{comments: Comment[], marketId: string}>}
 */
const CommentsContext = React.createContext(null);
function useComments() {
  return React.useContext(CommentsContext).comments;
}
function useMarketId() {
  return React.useContext(CommentsContext).marketId;
}

/**
 * A question or issue
 * @param {{comment: Comment, comments: Comment[]}} props
 */
function Comment(props) {
  const { comment, marketId, comments } = props;

  const intl = useIntl();
  const classes = useCommentStyles();
  const { id, comment_type: commentType } = comment;
  const presences = usePresences(marketId);
  const createdBy = useCommenter(comment, presences) || unknownPresence;
  const updatedBy = useUpdatedBy(comment, presences) || unknownPresence;
  const [marketsState] = useContext(MarketsContext);
  const user = getMyUserForMarket(marketsState, marketId) || {};
  const replies = comments.filter(comment => comment.reply_id === id);
  const sortedReplies = _.sortBy(replies, "created_at");
  const [highlightedCommentState, highlightedCommentDispatch] = useContext(
    HighlightedCommentContext
  );
  const [replyOpen, setReplyOpen] = useState(false);
  const [myHighLightId, setMyHighLightId] = useState(undefined);
  const [editOpen, setEditOpen] = useState(false);
  const [operationRunning] = useContext(OperationInProgressContext);

  function toggleReply() {
    setReplyOpen(!replyOpen);
  }

  function toggleEdit() {
    setEditOpen(!editOpen);
  }

  function reopen() {
    return reopenComment(marketId, id);
  }

  function resolve() {
    return resolveComment(marketId, id);
  }

  const [repliesExpanded, setRepliesExpanded] = React.useState(
    !comment.resolved || comment.reply_id
  );
  useEffect(() => {
    function getHilightedLeveId(myReplies) {
      if (_.isEmpty(myReplies)) {
        return undefined;
      }
      const highlightedReplies = myReplies.filter(
        reply => reply.id in highlightedCommentState
      );
      const highlightedRepliesRed = highlightedReplies.filter(reply => {
        const level = highlightedCommentState[reply.id];
        return level === "RED";
      });
      if (!_.isEmpty(highlightedRepliesRed)) {
        return highlightedRepliesRed[0].id;
      }
      if (!_.isEmpty(highlightedReplies)) {
        return highlightedReplies[0].id;
      }
      let descendentHighlightedId = undefined;
      myReplies.map(reply => {
        const replyReplies = comments.filter(
          comment => comment.reply_id === reply.id
        );
        const myDescendentHighlightedId = getHilightedLeveId(replyReplies);
        if (myDescendentHighlightedId) {
          descendentHighlightedId = myDescendentHighlightedId;
        }
        return reply;
      });
      return descendentHighlightedId;
    }
    const highlightId = getHilightedLeveId(replies);
    setMyHighLightId(highlightId);
  }, [id, highlightedCommentState, repliesExpanded, replies, comments]);

  const displayUpdatedBy =
    updatedBy !== undefined && comment.updated_by !== comment.created_by;

  const showActions = !replyOpen || replies.length > 0;
  function getCommentHighlightStyle() {
    if (id in highlightedCommentState) {
      const level = highlightedCommentState[id];
      if (level === "YELLOW") {
        return classes.containerYellow;
      }
      return classes.containerRed;
    }
    return classes.container;
  }

  const isEditable = user !== undefined && comment.created_by === user.id;

  return (
    <React.Fragment>
      <Card className={getCommentHighlightStyle()}>
        <Box display="flex">
          <CardType className={classes.commentType} type={commentType} />
          <Typography className={classes.updatedBy}>
            {displayUpdatedBy &&
              `${intl.formatMessage({ id: "lastUpdatedBy" })} ${
                updatedBy.name
              }`}
          </Typography>
          {enableEditing && isEditable && (
            <Button
              className={clsx(
                classes.action,
                classes.actionSecondary,
                classes.actionEdit
              )}
              onClick={toggleEdit}
              variant="contained"
            >
              <FormattedMessage id="edit" />
            </Button>
          )}
          <SpinBlockingButton
            className={clsx(
              classes.action,
              classes.actionSecondary,
              classes.actionResolveToggle
            )}
            color="primary"
            disabled={operationRunning}
            marketId={marketId}
            onClick={comment.resolved ? reopen : resolve}
            variant="contained"
          >
            {intl.formatMessage({
              id: comment.resolved
                ? "commentReopenLabel"
                : "commentResolveLabel"
            })}
          </SpinBlockingButton>
        </Box>
        <CardContent className={classes.cardContent}>
          <Typography className={classes.createdBy} variant="caption">
            {createdBy.name}
          </Typography>
          <Box marginTop={1}>
            <ReadOnlyQuillEditor value={comment.body} />
            {editOpen && (
              <CommentEdit
                marketId={marketId}
                comment={comment}
                onSave={toggleEdit}
                onCancel={toggleEdit}
              />
            )}
          </Box>
        </CardContent>
        {showActions && (
          <CardActions className={`${classes.cardActions} ${classes.actions}`}>
            {replies.length > 0 && (
              <Button
                className={clsx(classes.action, classes.actionSecondary)}
                variant="contained"
                onClick={() => {
                  highlightedCommentDispatch({ type: HIGHLIGHT_REMOVE, id });
                  if (myHighLightId) {
                    setMyHighLightId(undefined);
                  }
                  setRepliesExpanded(!repliesExpanded);
                }}
              >
                <FormattedMessage
                  id={
                    repliesExpanded
                      ? "commentCloseThreadLabel"
                      : "commentViewThreadLabel"
                  }
                />
              </Button>
            )}
            {!comment.resolved && (
              <React.Fragment>
                <Button
                  className={clsx(classes.action, classes.actionPrimary)}
                  color="primary"
                  disabled={operationRunning}
                  onClick={toggleReply}
                  variant="contained"
                >
                  {intl.formatMessage({ id: "commentReplyLabel" })}
                </Button>
                {createdBy === user.id && (
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
          </CardActions>
        )}
        {replyOpen && (
          <CommentAdd
            marketId={marketId}
            parent={comment}
            onSave={toggleReply}
            onCancel={toggleReply}
            type={REPLY_TYPE}
          />
        )}
      </Card>
      <Box marginTop={1} paddingX={1} className={classes.childWrapper}>
        <CommentsContext.Provider value={{ comments, marketId }}>
          {repliesExpanded &&
            sortedReplies.map(child => {
              const { id: childId } = child;
              return (
                <InitialReply
                  key={childId}
                  comment={child}
                  marketId={marketId}
                  highLightId={myHighLightId}
                />
              );
            })}
        </CommentsContext.Provider>
      </Box>
    </React.Fragment>
  );
}

Comment.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  comment: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object).isRequired,
  depth: () => {
    // TODO error
    //return new Error('depth is deprecated')
    return null;
  },
  marketId: PropTypes.string.isRequired
};

function InitialReply(props) {
  const { comment, highLightId } = props;

  return <Reply id={`c${comment.id}`} comment={comment} highLightId={highLightId} />;
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
      containerYellow: {
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
  name: "unknown"
};

/**
 *
 * @param {{comment: Comment}} props
 */
function Reply(props) {
  const { comment, highLightId, ...other } = props;

  const marketId = useMarketId();
  const presences = usePresences(marketId);
  // TODO: these shouldn't be unknown?
  const commenter = useCommenter(comment, presences) || unknownPresence;

  const [marketsState] = useContext(MarketsContext);
  const user = getMyUserForMarket(marketsState, marketId) || {};
  const isEditable = user !== undefined && comment.created_by === user.id;

  const classes = useReplyStyles();

  const [editing, setEditing] = React.useState(false);
  function handleEditClick() {
    setEditing(true);
  }

  const [replyOpen, setReplyOpen] = React.useState(false);

  const intl = useIntl();
  return (
    <Card
      className={
        highLightId === comment.id ? classes.containerYellow : classes.container
      }
      {...other}
    >
      <CardContent className={classes.cardContent}>
        <Typography className={classes.commenter} variant="body2">
          {commenter.name}
        </Typography>
        <Typography className={classes.timeElapsed} variant="body2">
          <UsefulRelativeTime
            value={Date.parse(comment.created_at) - Date.now()}
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
      <CardActions className={classes.cardActions}>
        <Typography className={classes.timePosted} variant="body2">
          <FormattedDate value={comment.created_at} />
        </Typography>
        <Button
          className={classes.action}
          onClick={() => setReplyOpen(true)}
          variant="text"
        >
          Reply
        </Button>
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
      {replyOpen === true && (
        <div className={classes.replyContainer}>
          <CommentAdd
            marketId={marketId}
            parent={comment}
            onSave={() => setReplyOpen(false)}
            onCancel={() => setReplyOpen(false)}
            type={REPLY_TYPE}
          />
        </div>
      )}
      {comment.children !== undefined && (
        <CardContent className={classes.cardContent}>
          <ThreadedReplies
            replies={comment.children}
            highLightId={highLightId}
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
    }
  },
  { name: "ThreadedReplies" }
);
/**
 *
 * @param {{comments: Comment[], replies: string[]}} props
 */
function ThreadedReplies(props) {
  const { replies: replyIds, highLightId } = props;
  const comments = useComments();

  const classes = useThreadedReplyStyles();

  const replies = replyIds.map(replyId => {
    return comments.find(comment => comment.id === replyId);
  });

  return (
    <ol className={classes.container}>
      {replies.map((reply) => {
        if (reply) {
          return (
            <ThreadedReply
              comment={reply}
              highLightId={highLightId}
            />
          );
        }
        return React.Fragment;
      })}
    </ol>
  );
}

function ThreadedReply(props) {
  const { comment, highLightId } = props;
  return <Reply id={`c${comment.id}`} comment={comment} elevation={0} highLightId={highLightId} />;
}

/**
 * Convenience wrapper around FormattedRelativeTime that automatically
 * uses to biggest possible unit so that the value is >= 1
 */
function UsefulRelativeTime(props) {
  const { value: miliseconds, ...other } = props;
  const seconds = Math.trunc(miliseconds / 1000);
  const minutes = Math.trunc(seconds / 60);
  const hours = Math.trunc(minutes / 60);
  const days = Math.trunc(hours / 24);

  if (minutes === 0) {
    return <FormattedRelativeTime {...other} unit="second" value={seconds} />;
  }
  if (hours === 0) {
    return <FormattedRelativeTime {...other} unit="minute" value={minutes} />;
  }
  if (days === 0) {
    return <FormattedRelativeTime {...other} unit="hour" value={hours} />;
  }
  return <FormattedRelativeTime {...other} unit="day" value={days} />;
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
