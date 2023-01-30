import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';

function DecideWhereStep (props) {
  const { marketId, updateFormData, fromCommentIds, marketComments } = props;
  const classes = useContext(WizardStylesContext);
  const comments = (fromCommentIds || []).map((fromCommentId) =>
    marketComments.find((comment) => comment.id === fromCommentId) || {id: 'notFound'});

  if (comments.find((comment) => comment.id === 'notFound')) {
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        Where do you want to move?
      </Typography>
      <div style={{maxHeight: '300px', overflowY: 'auto', overflowX: 'hidden', paddingRight: '0.5rem',
        paddingLeft: '0.5rem'}}>
        <CommentBox
          comments={comments}
          marketId={marketId}
          allowedTypes={[]}
          isInbox
          removeActions
        />
      </div>
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        nextLabel="JobWizardNewJob"
        showOtherNext
        otherNextLabel="JobWizardExistingJob"
        onOtherNext={() => updateFormData({ isMoveExisting: true })}
        showTerminate={false}
      />
    </div>
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