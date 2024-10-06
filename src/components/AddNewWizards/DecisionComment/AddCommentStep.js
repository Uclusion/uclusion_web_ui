import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import { useIntl } from 'react-intl';
import { formInvestibleLink, formMarketLink, navigate } from '../../../utils/marketIdPathFunctions';
import CommentAdd, { hasCommentValue } from '../../Comments/CommentAdd';
import { useHistory } from 'react-router';
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks';
import { getMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { getComment } from '../../../contexts/CommentsContext/commentsContextHelper';
import JobDescription from '../../InboxWizards/JobDescription';

export function hasDecisionComment(groupId, commentType, investibleId) {
  return hasCommentValue(groupId, undefined, 'DecisionCommentAdd', investibleId,
    `decisionComment${commentType}`);
}

function AddCommentStep (props) {
  const { investibleId, commentType, marketId, groupId, formData, updateFormData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [marketsState] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const history = useHistory();
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('addDecisionCommentWizard');
  const [commentAddState, updateCommentAddState, commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, investibleId);
  const market = getMarket(marketsState, marketId) || {};
  const { parent_comment_id: parentCommentId, parent_comment_market_id: parentMarketId } = market;
  const parentComment = getComment(commentsState, parentMarketId, parentCommentId) || {};
  const { useCompression } = formData;

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
      <Typography className={classes.introText}>
        What is your {intl.formatMessage({ id: `${commentType.toLowerCase()}Simple` }).toLowerCase()}?
      </Typography>
      <Typography className={classes.introSubText} variant="subtitle1">
        This comment will go to those interested in this option - otherwise use @ mentions for different addressing.
      </Typography>
      <JobDescription marketId={marketId} investibleId={investibleId} comments={[]}
                      useCompression={useCompression}
                      toggleCompression={() => updateFormData({useCompression: !useCompression})} />
      <CommentAdd
        nameKey="DecisionCommentAdd"
        type={commentType}
        wizardProps={{...props, finish: onFinish, terminateLabel: 'DecisionCommmentWizardTerminate', isAddWizard: true,
          isSent: true, onTerminate: onFinish}}
        commentAddState={commentAddState}
        updateCommentAddState={updateCommentAddState}
        commentAddStateReset={commentAddStateReset}
        marketId={marketId}
        groupId={groupId}
        fromInvestibleId={investibleId}
        onSave={onFinish}
        nameDifferentiator={`decisionComment${commentType}`}
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