import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { useIntl } from 'react-intl';
import JobDescription from '../JobDescription';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getMarketInfo } from '../../../utils/userFunctions';
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';

function DecideVoteStep(props) {
  const { marketId, commentRoot, formData, updateFormData } = props;
  const [commentState] = useContext(CommentsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const comments = (commentState[marketId] || []).filter((comment) =>
    comment.root_comment_id === commentRoot.id || comment.id === commentRoot.id);
  const classes = wizardStyles();
  const intl = useIntl();
  const { useCompression } = formData;
  const investibleId = commentRoot.investible_id;
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { assigned } = marketInfo;
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const userId = myPresence?.id;
  const isAssigned = (assigned || []).includes(userId);
  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        {intl.formatMessage({ id: 'DecideVoteTitle' })}
      </Typography>
      {isAssigned && (
        <Typography className={classes.introSubText} variant="subtitle1">
          You can use the move button to convert this suggestion to a task.
        </Typography>
      )}
      {!isAssigned && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Use the mute button if you don't want further notifications on this vote.
        </Typography>
      )}
      <JobDescription marketId={marketId} investibleId={investibleId} comments={comments}
                      showVoting inboxMessageId={commentRoot.id}
                      useCompression={useCompression}
                      toggleCompression={() => updateFormData({ useCompression: !useCompression })}
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