import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getCommentThreads } from '../../../contexts/CommentsContext/commentsContextHelper';
import { formCommentLink } from '../../../utils/marketIdPathFunctions';
import { moveComments } from '../../../api/comments';
import { onCommentsMove } from '../../../utils/commentFunctions';

export function moveCommentsFromIds(inv, comments, fromCommentIds, marketId, groupId, messagesState, updateFormData,
  commentsDispatch, messagesDispatch) {
  const { investible } = inv;
  const investibleId = investible.id;
  return moveComments(marketId, investibleId, fromCommentIds)
    .then((movedComments) => {
      onCommentsMove(fromCommentIds, messagesState, comments, investibleId, commentsDispatch, marketId,
        movedComments, messagesDispatch);
      const link = formCommentLink(marketId, groupId, investibleId, fromCommentIds[0]);
      updateFormData({
        investibleId,
        link,
      });
      return {link};
    });
}

function DecideWhereStep (props) {
  const { marketId, fromCommentIds, marketComments, updateFormData, formData } = props;
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
      <CommentBox
        comments={comments}
        marketId={marketId}
        allowedTypes={[]}
        isInbox
        isMove
        removeActions
        toggleCompression={() => updateFormData({useCompression: !useCompression})}
        useCompression={useCompression}
      />
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
        showTerminate={false}
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