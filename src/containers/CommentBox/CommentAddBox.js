import React from 'react';
import PropTypes from 'prop-types';
import CommentAdd from '../../components/Comments/CommentAdd';
import { getPageReducerPage, usePageStateReducer } from '../../components/PageState/pageStateHooks';
import _ from 'lodash';

function CommentAddBox(props) {
  const {
    marketId,
    groupId,
    investible,
    allowedTypes,
    issueWarningId,
    isStory,
    nameDifferentiator,
    wizardProps,
    onSave
  } = props;
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('commentAdd');
  const investibleId = investible ? investible.id : undefined;
  const [commentAddState, updateCommentAddState, commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, investibleId || marketId);
  const {
    type,
  } = commentAddState;
  const isSingleType = _.size(allowedTypes) === 1;
  const useType = type || (isSingleType ? allowedTypes[0] : undefined);

  return (
      <CommentAdd
        type={useType}
        wizardProps={wizardProps}
        onSave={onSave}
        commentAddState={commentAddState}
        updateCommentAddState={updateCommentAddState}
        commentAddStateReset={commentAddStateReset}
        onCancel={() => commentAddStateReset()}
        investible={investible}
        marketId={marketId}
        groupId={groupId}
        issueWarningId={issueWarningId}
        isStory={isStory}
        nameDifferentiator={nameDifferentiator}
        autoFocus={false}
      />
  );
}

CommentAddBox.propTypes = {
  marketId: PropTypes.string.isRequired,
  issueWarningId: PropTypes.string,
  todoWarningId: PropTypes.string,
  investible: PropTypes.any,
  allowedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  isStory: PropTypes.bool,
  onSave: PropTypes.func
};

CommentAddBox.defaultProps = {
  investible: undefined,
  issueWarningId: null,
  todoWarningId: null,
  isStory: false,
  onSave: () => {}
};

export default CommentAddBox;
