import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { useIntl } from 'react-intl';
import CommentAdd from '../../Comments/CommentAdd';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';

function AddCommentStep (props) {
  const { marketId, groupId, useType, updateFormData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('addDecisionCommentWizard');
  const [commentAddState, updateCommentAddState, commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, groupId);

  function onFinish(comment) {
    updateFormData({inlineMarketId: comment.inline_market_id, commentId: comment.id})
  }

  return (
    <WizardStepContainer
      {...props}
    >
    <div>
      <Typography className={classes.introText}>
        What is your {intl.formatMessage({ id: `${useType.toLowerCase()}Tip` }).toLowerCase()}?
      </Typography>
      <CommentAdd
        nameKey="MarketCommentAdd"
        type={useType}
        wizardProps={{...props, onFinish, isSent: false}}
        commentAddState={commentAddState}
        updateCommentAddState={updateCommentAddState}
        commentAddStateReset={commentAddStateReset}
        marketId={marketId}
        groupId={groupId}
        onSave={onFinish}
        nameDifferentiator="marketComment"
        isStory={true}
      />
    </div>
    </WizardStepContainer>
  );
}

AddCommentStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

AddCommentStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default AddCommentStep;