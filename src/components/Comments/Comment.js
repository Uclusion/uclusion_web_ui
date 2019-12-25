import React, { useContext, useState } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Button,
  ButtonGroup,
  Grid,
} from '@material-ui/core';
import _ from 'lodash';
import ReadOnlyQuillEditor from '../TextEditors/ReadOnlyQuillEditor';
import CommentAdd from './CommentAdd';
import { REPLY_TYPE } from '../../constants/comments';
import RaisedCard from '../Cards/RaisedCard';
import { reopenComment, resolveComment } from '../../api/comments';
import { getCommentTypeIcon } from './commentFunctions';
import SpinBlockingButton from '../SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import CommentEdit from './CommentEdit';

function Comment(props) {
  const {
    comment,
    depth,
    marketId,
    comments,
  } = props;
  const intl = useIntl();
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
  const icon = getCommentTypeIcon(commentType);
  return (
    <RaisedCard>
      {icon}
      <Grid
        container
        direction="column"
      >
        {commenter && (
          <Grid
            item
            xs={12}
          >
            {commenter.name}
          </Grid>
        )}
        <Grid
          item
          xs={12}
        >
          <ReadOnlyQuillEditor value={comment.body} />
          {editOpen && (
            <CommentEdit
              marketId={marketId}
              comment={comment}
              onSave={toggleEdit}
              onCancel={toggleEdit}
            />
          )}
        </Grid>
        <Grid
          item
          xs={12}
        >

          {!comment.resolved && (
            <ButtonGroup
              disabled={operationRunning}
              color="primary"
              variant="contained"
            >
              <Button onClick={toggleReply}>
                {intl.formatMessage({ id: 'commentReplyLabel' })}
              </Button>
              <Button onClick={toggleEdit}>
                {intl.formatMessage({ id: 'commentEditLabel' })}
              </Button>
              {!comment.reply_id && (
                <SpinBlockingButton
                  marketId={marketId}
                  onClick={resolve}
                >
                  {intl.formatMessage({ id: 'commentResolveLabel' })}
                </SpinBlockingButton>
              )}
            </ButtonGroup>
          )}
          {comment.resolved && (
            <ButtonGroup
              disabled={operationRunning}
              color="primary"
              variant="contained"
            >
              {children && (
                <Button onClick={flipToggledOpen}>
                  {!toggledOpen && intl.formatMessage({ id: 'commentViewThreadLabel' })}
                  {toggledOpen && intl.formatMessage({ id: 'commentCloseThreadLabel' })}
                </Button>
              )}
              <SpinBlockingButton
                marketId={marketId}
                onClick={reopen}
              >
                {intl.formatMessage({ id: 'commentReopenLabel' })}
              </SpinBlockingButton>
            </ButtonGroup>
          )}
        </Grid>
        {replyOpen && (
          <Grid
            item
            xs={12}
          >

            <CommentAdd
              marketId={marketId}
              parent={comment}
              onSave={toggleReply}
              onCancel={toggleReply}
              type={REPLY_TYPE}
            />
          </Grid>
        )}
        {expanded && (
          <Grid
            item
            xs={12}
          >
            {getChildComments()}
          </Grid>
        )}
      </Grid>
    </RaisedCard>
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
