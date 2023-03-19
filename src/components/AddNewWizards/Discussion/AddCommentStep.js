import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { useIntl } from 'react-intl';
import CommentAdd from '../../Comments/CommentAdd';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { SUGGEST_CHANGE_TYPE } from '../../CardType';
import { formCommentLink, formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';

function AddCommentStep (props) {
  const { marketId, groupId, updateFormData, useType } = props;
  const intl = useIntl();
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('addDecisionCommentWizard');
  const [commentAddState, updateCommentAddState, commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, groupId);

  function onSave(comment) {
    if (comment.is_sent) {
      navigate(history, formCommentLink(marketId, groupId, undefined, comment.id));
    } else {
      updateFormData({ inlineMarketId: comment.inline_market_id, commentId: comment.id, marketId, groupId });
    }
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
    <div>
      <Typography className={classes.introText}>
        What is your {intl.formatMessage({ id: `${useType.toLowerCase()}Tip` }).toLowerCase()}?
      </Typography>
      <CommentAdd
        nameKey="DiscussionCommentAdd"
        type={useType}
        wizardProps={{...props, isSent: false, isAddWizard: true,
          onTerminate: () => navigate(history, formMarketLink(marketId, groupId)),
          skipNextStep: useType === SUGGEST_CHANGE_TYPE}}
        commentAddState={commentAddState}
        updateCommentAddState={updateCommentAddState}
        commentAddStateReset={commentAddStateReset}
        marketId={marketId}
        groupId={groupId}
        onSave={onSave}
        nameDifferentiator="marketComment"
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