import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getCommentThreads } from '../../../contexts/CommentsContext/commentsContextHelper';
import CondensedTodos from '../../../pages/Investible/Planning/CondensedTodos';
import _ from 'lodash';

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
            isMove
            removeActions
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