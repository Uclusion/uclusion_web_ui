import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { useIntl } from 'react-intl';
import { formInvestibleLink, formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import CommentAdd from '../../Comments/CommentAdd';
import { useHistory } from 'react-router';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';

function AddCommentStep (props) {
  const { investibleId, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [marketsState] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const { useType, marketId, groupId } = formData;
  const history = useHistory();
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('addDecisionCommentWizard');
  const [commentAddState, updateCommentAddState, commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, investibleId);
  const market = getMarket(marketsState, marketId) || {};
  const { parent_comment_id: parentCommentId, parent_comment_market_id: parentMarketId } = market;
  const parentComment = getComment(commentsState, parentMarketId, parentCommentId) || {};
  function onFinish() {
    if (parentComment.investible_id) {
      navigate(history,
        `${formInvestibleLink(parentMarketId, parentComment.investible_id)}#option${investibleId}`);
    } else {
      navigate(history,
        `${formMarketLink(parentMarketId, parentComment.group_id)}#option${investibleId}`);
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
        nameKey="DecisionCommentAdd"
        type={useType}
        wizardProps={{...props, finish: onFinish, terminateLabel: 'DecisionCommmentWizardTerminate', isAddWizard: true,
          isSent: true, onTerminate: onFinish}}
        commentAddState={commentAddState}
        updateCommentAddState={updateCommentAddState}
        commentAddStateReset={commentAddStateReset}
        marketId={marketId}
        groupId={groupId}
        fromInvestibleId={investibleId}
        onSave={onFinish}
        nameDifferentiator="decisionComment"
        isStory={false}
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