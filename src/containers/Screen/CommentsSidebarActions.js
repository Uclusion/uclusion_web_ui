import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { List, ListItem, ListItemIcon, ListItemText, Tooltip, Divider, Card } from '@material-ui/core';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../constants/comments';
import ReportProblemIcon from '@material-ui/icons/ReportProblem';
import ContactSupportIcon from '@material-ui/icons/ContactSupport';
import ChangeHistoryIcon from '@material-ui/icons/ChangeHistory';
import { useIntl } from 'react-intl';
import CommentAdd from '../../components/Comments/CommentAdd';
import _ from 'lodash';
import Issue from '../../components/Issues/Issue';
import Comment from '../../components/Comments/Comment';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';

// starts out amOpen, goes large, with comments contained
function CommentsSidebarActions(props) {
  const intl = useIntl();

  const {
    amOpen,
    setAmOpen,
    onClick,
    investible,
    marketId,
  } = props;

  const [activeType, setActiveType] = useState(null);
  const [commentsState] = useContext(CommentsContext);
  const comments = getMarketComments(commentsState, marketId);
  const commentsHash = _.keyBy(comments, 'id');
  const marketComments = comments.filter((comment) => !comment.investible_id);
  const investibleComments = comments.filter((comment) => comment.investible_id);
  const marketOnly = _.isEmpty(investible);

  function handleClick(type) {
    setAmOpen(true);
    setActiveType(type);
    onClick(type);
  }

  const usedComments = marketOnly ? marketComments : investibleComments;
  // we only care about thread roots that are not resolved
  const threadRoots = usedComments.filter((comment) => !comment.reply_id && !comment.is_resolved);

  function getCommentCards() {
    return threadRoots.map((comment) => {
      const isIssue = comment.comment_type === ISSUE_TYPE;
      const RenderedComment = (isIssue) ? Issue : Comment;
      return (
        <Card key={comment.id}>
          <RenderedComment
            depth={0}
            marketId={marketId}
            comment={comment}
            commentsHash={commentsHash}
          />
        </Card>
      );
    });
  }

  // if we're not open, just return the buttons
  if (!amOpen) {
    return (
      <List>
        <ListItem
          button
          key="issue"
          onClick={() => handleClick(ISSUE_TYPE)}
        >
          <ListItemIcon>
            <Tooltip title={intl.formatMessage({ id: 'commentIconRaiseIssueLabel' })}>
              <ReportProblemIcon/>
            </Tooltip>
          </ListItemIcon>
        </ListItem>
        <ListItem
          button
          key="question"
          onClick={() => handleClick(QUESTION_TYPE)}
        >
          <ListItemIcon>
            <Tooltip title={intl.formatMessage({ id: 'commentIconAskQuestionLabel' })}>
              <ContactSupportIcon/>
            </Tooltip>
          </ListItemIcon>
        </ListItem>
        {!marketOnly && (
          <ListItem
            button
            key="changes"
            onClick={() => handleClick(SUGGEST_CHANGE_TYPE)}
          >
            <ListItemIcon>
              <Tooltip title={intl.formatMessage({ id: 'commentIconSuggestChangesLabel' })}>
                <ChangeHistoryIcon/>
              </Tooltip>
            </ListItemIcon>
          </ListItem>
        )}
      </List>
    );
  }
  // expanded
  return (
    <React.Fragment>
      <List>
        <ListItem
          button
          key="question"
          onClick={() => handleClick(QUESTION_TYPE)}
        >
          <ListItemIcon>
            <ContactSupportIcon/>
          </ListItemIcon>
          <ListItemText>
            {intl.formatMessage({ id: 'commentIconAskQuestionLabel' })}
          </ListItemText>
        </ListItem>
        {!marketOnly && (<ListItem
            button
            key="changes"
            onClick={() => handleClick(SUGGEST_CHANGE_TYPE)}
          >
            <ListItemIcon>
              <ChangeHistoryIcon/>
            </ListItemIcon>
            <ListItemText>
              {intl.formatMessage({ id: 'commentIconSuggestChangesLabel' })}
            </ListItemText>
          </ListItem>
        )}
      </List>
      <Divider/>
      {activeType === ISSUE_TYPE &&
      <CommentAdd onCancel={() => setActiveType(null)} type={ISSUE_TYPE} investible={investible} marketId={marketId}/>}
      {activeType === QUESTION_TYPE &&
      <CommentAdd onCancel={() => setActiveType(null)} type={QUESTION_TYPE} investible={investible}
                  marketId={marketId}/>}
      {activeType === SUGGEST_CHANGE_TYPE &&
      <CommentAdd onCancel={() => setActiveType(null)} type={SUGGEST_CHANGE_TYPE} investible={investible}
                  marketId={marketId}/>}
      {getCommentCards()}
    </React.Fragment>
  );
}

CommentsSidebarActions.propTypes = {
  amOpen: PropTypes.bool.isRequired,
  setAmOpen: PropTypes.func.isRequired,
  onClick: PropTypes.func,
  marketId: PropTypes.string.isRequired,
  investible: PropTypes.object,
  comments: PropTypes.arrayOf(PropTypes.object),
  commentsHash: PropTypes.object,
};

CommentsSidebarActions.defaultProps = {
  onClick: () => {
  },
  investible: {},
  comments: [],
  commentsHash: {},
};
export default CommentsSidebarActions;