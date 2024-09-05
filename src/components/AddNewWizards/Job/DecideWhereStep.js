import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getCommentThreads, moveToDiscussion } from '../../../contexts/CommentsContext/commentsContextHelper';
import CondensedTodos from '../../../pages/Investible/Planning/CondensedTodos';
import _ from 'lodash';
import { REPLY_TYPE } from '../../../constants/comments';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { useHistory } from 'react-router';

function DecideWhereStep (props) {
  const { marketId, fromCommentIds, marketComments, updateFormData, formData, isQuestion, useType } = props;
  const history = useHistory();
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = useContext(WizardStylesContext);
  const roots = (fromCommentIds || []).map((fromCommentId) =>
    marketComments.find((comment) => comment.id === fromCommentId) || {id: 'notFound'});
  const comments = getCommentThreads(roots, marketComments);
  const { useCompression } = formData;

  if (comments.find((comment) => comment.id === 'notFound')) {
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        Where do you want to move?
      </Typography>
      {useType && (
        <Typography className={classes.introSubText} variant="subtitle1">
          You are converting to a {useType}.
        </Typography>
      )}
      {_.size(roots) > 1 && (
        <CondensedTodos comments={roots} investibleComments={comments} isInbox marketId={marketId} hideTabs
                        isDefaultOpen />
      )}
      {_.size(roots) === 1 && (
        <>
          <CommentBox
            comments={comments}
            marketId={marketId}
            allowedTypes={[]}
            isInbox
            compressAll
            isMove
            removeActions
            displayRepliesAsTop={roots[0].comment_type === REPLY_TYPE}
            inboxMessageId={roots[0].id}
            toggleCompression={() => updateFormData({ useCompression: !useCompression })}
            useCompression={useCompression}
          />
          <div className={classes.borderBottom}/>
        </>
      )}
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        nextLabel="JobWizardNewJob"
        isFinal={false}
        spinOnClick={false}
        onNextSkipStep
        showOtherNext
        otherNextLabel="JobWizardExistingJob"
        otherSpinOnClick={false}
        showTerminate={isQuestion}
        terminateLabel="DiscussionMoveLabel"
        terminateSpinOnClick
        onTerminate={() => moveToDiscussion(roots[0], commentsState, commentsDispatch, setOperationRunning,
          history)}
      />
    </WizardStepContainer>
  );
}

DecideWhereStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideWhereStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideWhereStep;