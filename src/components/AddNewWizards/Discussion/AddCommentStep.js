import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { useIntl } from 'react-intl';
import CommentAdd, { hasCommentValue } from '../../Comments/CommentAdd';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { formCommentLink, formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { useInvestibleEditStyles } from '../../../pages/Investible/InvestibleBodyEdit';
import { getGroup } from '../../../contexts/MarketGroupsContext/marketGroupsContextHelper';
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext';

export function hasDiscussionComment(groupId, commentType) {
  return hasCommentValue(groupId, undefined, 'DiscussionCommentAdd', undefined,
    `marketComment${commentType}`);
}

function AddCommentStep (props) {
  const { marketId, groupId, updateFormData, useType, onFinishCreation } = props;
  const intl = useIntl();
  const history = useHistory();
  const [groupState] = useContext(MarketGroupsContext);
  const classes = useContext(WizardStylesContext);
  const investibleEditClasses = useInvestibleEditStyles();
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('addDecisionCommentWizard');
  const [commentAddState, updateCommentAddState, commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, groupId);
  const group = getGroup(groupState, marketId, groupId);
  const { name: groupName } = group || {};

  function onSave(comment) {
    if (comment.is_sent) {
      navigate(history, formCommentLink(marketId, groupId, undefined, comment.id));
    } else {
      onFinishCreation();
      updateFormData({ inlineMarketId: comment.inline_market_id, commentId: comment.id, marketId, groupId });
    }
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText}>
        What is your {intl.formatMessage({ id: `${useType.toLowerCase()}Tip` }).toLowerCase()}?
      </Typography>
      <Typography className={investibleEditClasses.title} variant="h3" component="h1"
                  style={{cursor: 'pointer', color: 'blue', textDecoration: 'underline'}}
                  onClick={() => navigate(history, formMarketLink(marketId, groupId))}>
        Group '{groupName}'
      </Typography>
      <CommentAdd
        nameKey="DiscussionCommentAdd"
        type={useType}
        wizardProps={{...props, isSent: false, isAddWizard: true}}
        commentAddState={commentAddState}
        updateCommentAddState={updateCommentAddState}
        commentAddStateReset={commentAddStateReset}
        marketId={marketId}
        groupId={groupId}
        onSave={onSave}
        nameDifferentiator={`marketComment${useType}`}
      />
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