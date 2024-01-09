import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons';
import CommentBox from '../../../containers/CommentBox/CommentBox'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { getInvestible, getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../../utils/userFunctions'
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';
import _ from 'lodash';
import { useInvestibleVoters } from '../../../utils/votingUtils';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';

function DecideVoteStep(props) {
  const { marketId, commentRoot, formData, updateFormData, message } = props;
  const [commentState] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const intl = useIntl();
  const inv = commentRoot.investible_id ? getInvestible(investibleState, commentRoot.investible_id) : undefined;
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { stage } = marketInfo;
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const { useCompression } = formData;
  const investibles = getMarketInvestibles(investiblesState, commentRoot.inline_market_id);
  const marketPresences = getMarketPresences(marketPresencesState, commentRoot.inline_market_id) || [];
  const voters = useInvestibleVoters(marketPresences,
    _.isEmpty(investibles) ? undefined : investibles[0].investible.id, marketId);

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({id: 'DecideVoteTitle'})}
      </Typography>
      {_.isEmpty(voters) && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Vote here or click the suggestion to reply, mute, resolve, or move to task.
        </Typography>
      )}
      {!_.isEmpty(voters) && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Vote here or click the suggestion to reply, mute, resolve, or see <b>{_.size(voters)} existing votes</b>.
        </Typography>
      )}
      {commentRoot.investible_id && (
        <div style={{paddingBottom: '1rem'}}>
          <JobDescription marketId={marketId} investibleId={commentRoot.investible_id} comments={comments}
                          removeActions
                          showVoting={false}
                          useCompression={useCompression}
                          toggleCompression={() => updateFormData({useCompression: !useCompression})}
                          showDescription={false}
                          showAssigned={false} />
        </div>
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