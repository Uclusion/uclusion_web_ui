import React, { useContext, useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Button,
  Box,
  ButtonGroup,
  Card,
  CardContent,
  CardActions,
  Typography,
} from '@material-ui/core';
import { makeStyles } from '@material-ui/styles';
import _ from 'lodash';
import ReadOnlyQuillEditor from '../TextEditors/ReadOnlyQuillEditor';
import CommentAdd from './CommentAdd';
import { REPLY_TYPE } from '../../constants/comments';
import { reopenComment, resolveComment } from '../../api/comments';
import SpinBlockingButton from '../SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import CustomChip from '../CustomChip';
import CommentEdit from './CommentEdit';

const useStyles = makeStyles({
  container: {
      padding: '21px 21px 8px',
      background: 'white',
      boxShadow: 'none',
  },
  chip: {
      marginTop: '12px',
  },
  content: {
      marginTop: '12px',
      fontSize: '15px',
      lineHeight: '175%',
  },
  actions: {
      marginTop: '25px',
      display: 'flex',
      justifyContent: 'flex-end',
      boxShadow: 'none',
      width: '100%',
  },
  action: {
      minWidth: '89px',
      height: '36px',
      color: 'rgba(0,0,0,0.38)',
      fontWeight: '700',
      fontSize: '14px',
      lineHeight: '18px',
      letterSpacing: '0.02em',
      textTransform: 'uppercase',
      background: 'transparent',
      borderRight: 'none !important',
      '&:hover': {
          color: '#ca2828',
          background: 'white',
          boxShadow: 'none',
      },
  },
});
function Comment(props) {
  const {
    comment,
    depth,
    marketId,
    comments,
  } = props;
  const intl = useIntl();
  const classes = useStyles();
  const { id, comment_type: commentType } = comment;
  const [presencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(presencesState, marketId) || [];
  const commenter = presences.find((presence) => presence.id === comment.created_by);
  const children = comments.filter((comment) => comment.reply_id === id);
  const sortedChildren = _.sortBy(children, 'created_at');
  const [replyOpen, setReplyOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);
  const [toggledOpen, setToggledOpen] = useState(false);
  const [operationRunning] = useContext(OperationInProgressContext);

  function getChildComments() {
    if (_.isEmpty(sortedChildren)) {
      return <></>;
    }
    return sortedChildren.map((child) => {
      const { id: childId } = child;
      const childDepth = depth + 1;
      // we are rendering ourselves, so we don't get the injection automagically
      return (
        <Comment
          key={childId}
          comment={child}
          depth={childDepth}
          marketId={marketId}
          comments={comments}
        />
      );
    });
  }

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

  function flipToggledOpen() {
    setToggledOpen(!toggledOpen);
  }

  const isRoot = !comment.reply_id;
  const expanded = replyOpen || toggledOpen || (isRoot && !comment.resolved) || comment.reply_id;
  
  return (
    <Card className={classes.container}>
            <CardContent>
                <CustomChip className={classes.chip} active={true} title={comment_type} />
                <Box marginTop={1}>
                  {commenter && (
                    <Typography>{commenter.name}</Typography>
                  )}
                  <ReadOnlyQuillEditor value={comment.body} paddingLeft={0} />
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
            <CardActions>
              {!comment.resolved && (
                <ButtonGroup
                  className={classes.actions}
                  disabled={operationRunning}
                  color="primary"
                  variant="contained"
                >
                  <Button className={classes.action} onClick={toggleReply}>
                    {intl.formatMessage({ id: 'commentReplyLabel' })}
                  </Button>
                  {!comment.reply_id && (
                    <SpinBlockingButton
                      className={classes.action}
                      marketId={marketId}
                      onClick={resolve}>
                      {intl.formatMessage({ id: 'commentResolveLabel' })}
                    </SpinBlockingButton>
                  )}
                </ButtonGroup>
              )}
              {comment.resolved && (
                <ButtonGroup
                  className={classes.actions}
                  disabled={operationRunning}
                  color="primary"
                  variant="contained"
                >
                  {children && (
                    <Button className={classes.action} onClick={flipToggledOpen}>
                      {!toggledOpen && intl.formatMessage({ id: 'commentViewThreadLabel' })}
                      {toggledOpen && intl.formatMessage({ id: 'commentCloseThreadLabel' })}
                    </Button>
                  )}
                  <SpinBlockingButton
                    className={classes.action}
                    marketId={marketId}
                    onClick={reopen}
                  >
                    {intl.formatMessage({ id: 'commentReopenLabel' })}
                  </SpinBlockingButton>
                </ButtonGroup>
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
              {expanded && getChildComments()}
            </CardActions>
        </Card>
  );
}

Comment.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  comment: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object).isRequired,
  depth: PropTypes.number.isRequired,
  marketId: PropTypes.string.isRequired,
};

export default Comment;
