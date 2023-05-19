import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import BugDescriptionStep from './BugDescriptionStep';
import queryString from 'query-string';
import { useLocation } from 'react-router';
import BugDecisionStep from './BugDecisionStep';
import {
  getComment,
  getCommentThreads,
  getMarketComments
} from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import _ from 'lodash';
import TaskToBugStep from './TaskToBugStep';

function BugWizard(props) {
  const { marketId, groupId, commentType } = props;
  const [commentsState] = useContext(CommentsContext);
  const location = useLocation();
  const { hash } = location;
  const values = queryString.parse(hash || '') || {};
  const { fromCommentId } = values;
  const comment = getComment(commentsState, marketId, fromCommentId) || {};
  const comments = !_.isEmpty(comment) ? getCommentThreads([comment],
    getMarketComments(commentsState, marketId, comment.group_id)) : [];

  return (
    <WizardStylesProvider>
      <FormdataWizard name="bug_wizard" useLocalStorage={false}>
        {!_.isEmpty(comment) && (
          <BugDecisionStep marketId={marketId} comment={comment} comments={comments} />
        )}
        {!_.isEmpty(comment) && (
          <TaskToBugStep marketId={marketId} comment={comment} comments={comments} />
        )}
        {!fromCommentId && (
          <BugDescriptionStep marketId={marketId} groupId={groupId} commentType={commentType} />
        )}
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

BugWizard.propTypes = {
  marketId: PropTypes.string.isRequired,
  groupId: PropTypes.string.isRequired,
};
export default BugWizard;

