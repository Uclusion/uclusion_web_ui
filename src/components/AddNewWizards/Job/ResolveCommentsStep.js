import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { SUGGEST_CHANGE_TYPE } from '../../../constants/comments';

function DecideResolveStep(props) {
  const { marketId, commentId, marketComments, updateFormData, formData } = props;
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const comment = (marketComments || []).find((comment) => comment.id === commentId) || {id: 'fake'};
  const classes = useContext(WizardStylesContext);
  const inv = comment.investible_id ? getInvestible(investibleState, comment.investible_id) : undefined;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const isSuggestion = comment.comment_type === SUGGEST_CHANGE_TYPE;
  const { useCompression } = formData;

  if (comment.id === 'fake') {
    return React.Fragment;
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      {isSuggestion && (
        <Typography className={classes.introText}>
          Will you move this suggestion to a task?
        </Typography>
      )}
      {!isSuggestion && (
        <Typography className={classes.introText}>
          Will you resolve this question?
        </Typography>
      )}
      <Typography className={classes.introSubText} variant="subtitle1">
        Jobs with open {isSuggestion ? 'suggestions' : 'questions'} move to Assistance Needed.
      </Typography>
      <div className={classes.wizardCommentBoxDiv}>
        <CommentBox
          comments={[comment]}
          marketId={marketId}
          allowedTypes={[]}
          fullStage={fullStage}
          investible={inv}
          marketInfo={marketInfo}
          isInbox
          compressAll
          inboxMessageId={commentId}
          removeActions
          showVoting
          toggleCompression={() => updateFormData({useCompression: !useCompression})}
          useCompression={useCompression}
        />
      </div>
      {isSuggestion && (
        <WizardStepButtons
          {...props}
          focus
          nextLabel="wizardAcceptLabel"
          onNext={() => updateFormData({doTaskId: commentId})}
          showOtherNext
          otherNextLabel="commentResolveLabelInstead"
          onOtherNext={() => updateFormData({doResolveId: commentId})}
          isFinal={false}
          showSkip
        />
      )}
      {!isSuggestion && (
        <WizardStepButtons
          {...props}
          nextLabel="commentResolveLabel"
          onNext={() => updateFormData({doResolveId: commentId})}
          isFinal={false}
          showSkip
        />
      )}
    </WizardStepContainer>
  );
}

DecideResolveStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideResolveStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideResolveStep;