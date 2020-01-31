import React, { useContext, useState } from "react";
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
  ButtonGroup,
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
import {
  REPLY_TYPE,
  ISSUE_TYPE,
  QUESTION_TYPE,
  SUGGEST_CHANGE_TYPE
} from "../../constants/comments";
import { reopenComment, resolveComment } from "../../api/comments";
import SpinBlockingButton from "../SpinBlocking/SpinBlockingButton";
import { OperationInProgressContext } from "../../contexts/OperationInProgressContext";
import { MarketPresencesContext } from "../../contexts/MarketPresencesContext/MarketPresencesContext";
import { getMarketPresences } from "../../contexts/MarketPresencesContext/marketPresencesHelper";
import CommentEdit from "./CommentEdit";
import { MarketsContext } from "../../contexts/MarketsContext/MarketsContext";
import { getMyUserForMarket } from "../../contexts/MarketsContext/marketsContextHelper";
// TODO create centralized icons repository
import IssueIcon from "@material-ui/icons/ReportProblem";
import QuestionIcon from "@material-ui/icons/ContactSupport";
import ChangeSuggstionIcon from "@material-ui/icons/ChangeHistory";

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
      color: "white",
      "&:hover": {
        backgroundColor: "#BDBDBD"
      }
    },
    commenter: {
      alignSelf: "baseline",
      color: "#434343",
      fontWeight: "bold",
      fontSize: 8,
      lineHeight: 1.75,
      marginLeft: "auto"
    },
    actionResolve: {
      alignSelf: "baseline",
      margin: "11px 12px 11px 16px"
    },
    commentType: {
      alignSelf: "start",
      display: "inline-flex"
    },
    childWrapper: {
      // borderTop: '1px solid #DCDCDC',
    },
    initialComment: {
      display: "flex"
    },
    avatarWrapper: {
      marginRight: "20px"
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
  const { id, comment_type: commentType, created_by: createdBy } = comment;
  const presences = usePresences(marketId);
  const updatedBy = useUpdatedBy(comment, presences) || unknownPresence;
  const [marketsState] = useContext(MarketsContext);
  const user = getMyUserForMarket(marketsState, marketId) || {};
  const replies = comments.filter(comment => comment.reply_id === id);
  const sortedReplies = _.sortBy(replies, "created_at");

  const [replyOpen, setReplyOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [operationRunning] = useContext(OperationInProgressContext);

  // TODO: what's the difference between comments and initialCommentS
  // while it uses plural it only returns a single comment
  // UPDATE: It's probably misinterpreted from the figma sketches
  // there's an issue with two comments: one has replies the other doesn't
  // the one without uses the same dummy text as the issue which includes
  // "initial comment"

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

  const displayUpdatedBy =
    updatedBy !== undefined && comment.updated_by !== createdBy;

  const showActions = !replyOpen || replies.length > 0;
  return (
    <React.Fragment>
      <Card className={classes.container}>
        <Box display="flex">
          <CommentType className={classes.commentType} type={commentType} />
          {displayUpdatedBy && (
            <Typography className={classes.commenter}>
              {`${intl.formatMessage({ id: "lastUpdatedBy" })} ${
                updatedBy.name
              }`}
            </Typography>
          )}
          {!comment.reply_id && (
            <SpinBlockingButton
              className={clsx(
                classes.action,
                classes.actionSecondary,
                classes.actionResolve
              )}
              disabled={operationRunning}
              marketId={marketId}
              onClick={resolve}
            >
              {intl.formatMessage({ id: "commentResolveLabel" })}
            </SpinBlockingButton>
          )}
        </Box>
        <CardContent className={classes.cardContent}>
          <Box marginTop={1}>
            <ReadOnlyQuillEditor value={comment.body} heading paddingLeft={0} />
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
            {comment.resolved && (
              <ButtonGroup
                disabled={operationRunning}
                color="primary"
                variant="contained"
              >
                <SpinBlockingButton
                  className={classes.action}
                  marketId={marketId}
                  onClick={reopen}
                >
                  {intl.formatMessage({ id: "commentReopenLabel" })}
                </SpinBlockingButton>
              </ButtonGroup>
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

const useCommentTypeStyles = makeStyles(
  {
    root: ({ type }) => {
      return {
        backgroundColor: {
          [ISSUE_TYPE]: "#E85757",
          [QUESTION_TYPE]: "#2F80ED",
          [SUGGEST_CHANGE_TYPE]: "#F29100"
        }[type],
        borderBottomRightRadius: 8,
        color: "white",
        padding: 8
      };
    },
    icon: {
      marginRight: 6,
      height: 16,
      width: 16
    },
    label: {
      fontSize: 12
    }
  },
  { name: "CommentType" }
);
// this used to be handled in "CustomChip". But the name is not descriptive
// so rather than messing with an unknown abstraction I handle it separately
// following "copy first, abstract later"
function CommentType(props) {
  const { className, type } = props;
  const classes = useCommentTypeStyles({ type });

  const IconComponent = {
    [ISSUE_TYPE]: IssueIcon,
    [QUESTION_TYPE]: QuestionIcon,
    [SUGGEST_CHANGE_TYPE]: ChangeSuggstionIcon
  }[type];

  // TODO i18n type
  return (
    <div className={clsx(classes.root, className)}>
      <IconComponent className={classes.icon} />
      <span className={classes.label}>{type}</span>
    </div>
  );
}
CommentType.propTypes = {
  type: PropTypes.oneOf([ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE])
};

function InitialReply(props) {
  const { comment } = props;

  return <Reply comment={comment} />;
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
        fontWeight: "500",
        fontSize: 10,
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
      commenter: {
        color: "#7E7E7E",
        display: "inline-block",
        fontSize: 12,
        fontWeight: "bold",
        marginRight: "8px",
        padding: "8px 0"
      },
      replyContainer: {
        marginLeft: theme.spacing(3)
      },
      timeElapsed: {
        color: "#A7A7A7",
        display: "inline-block",
        fontSize: 10
      },
      timePosted: {
        color: "#A7A7A7",
        display: "inline-block",
        fontSize: 10
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
  const { comment, ...other } = props;

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
    <Card {...other}>
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
          <ReadOnlyQuillEditor value={comment.body} paddingLeft={0} />
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
          <ThreadedReplies replies={comment.children} />
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
  const { replies: replyIds } = props;
  const comments = useComments();

  const classes = useThreadedReplyStyles();

  const replies = replyIds.map(replyId => {
    return comments.find(comment => comment.id === replyId);
  });

  return (
    <ol className={classes.container}>
      {replies.map(reply => {
        return <ThreadedReply key={reply.id} comment={reply}></ThreadedReply>;
      })}
    </ol>
  );
}

function ThreadedReply(props) {
  const { comment } = props;
  return <Reply comment={comment} elevation={0} />;
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
