import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../../utils/userFunctions'
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';

function DecideVoteStep(props) {
  const { marketId, commentRoot, formData, updateFormData, message } = props;
  const [commentState] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const intl = useIntl();
  const inv = commentRoot.investible_id ? getInvestible(investibleState, commentRoot.investible_id) : undefined;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const { useCompression } = formData;

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideVoteTitle'})}
      </Typography>
      {commentRoot.investible_id && (
        <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                        removeActions
                        showVoting
                        useCompression={useCompression}
                        toggleCompression={() => updateFormData({useCompression: !useCompression})}
                        showDescription={false}
                        showAssigned={false} />
      )}
      {!commentRoot.investible_id && (
        <div className={classes.wizardCommentBoxDiv}>
          <CommentBox
            comments={comments}
            marketId={marketId}
            allowedTypes={[]}
            fullStage={fullStage}
            investible={inv}
            marketInfo={marketInfo}
            isInbox
            removeActions
            useCompression={useCompression}
            toggleCompression={() => updateFormData({useCompression: !useCompression})}
          />
        </div>
      )}
      <WizardStepButtons
        {...props}
        nextLabel="voteFor"
        isFinal={false}
        onNext={() => updateFormData({ isFor: true })}
        spinOnClick={false}
        showOtherNext
        otherNextLabel="voteAgainst"
        onOtherNext={() => updateFormData({ isFor: false })}
        otherSpinOnClick={false}
        showTerminate={message.is_highlighted}
        terminateLabel="defer"
      />
    </WizardStepContainer>
  );
}

DecideVoteStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

DecideVoteStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default DecideVoteStep;