import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer'
import { wizardStyles } from '../WizardStylesContext'
import AddEditVote from '../../../pages/Investible/Voting/AddEditVote'
import { getPageReducerPage, usePageStateReducer } from '../../PageState/pageStateHooks'
import { getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'

function VoteCertaintyStep(props) {
  const { marketId, formData, commentRoot, message } = props;
  const [investiblesState] = useContext(InvestiblesContext);
  const classes = wizardStyles();
  const inlineInvestibles = getMarketInvestibles(investiblesState, commentRoot.inline_market_id) || [];
  const [fullInlineInvestible] = inlineInvestibles;
  const inlineInvestibleId = fullInlineInvestible ? fullInlineInvestible.investible.id : undefined;
  const { isFor } = formData;
  const [votingPageStateFull, votingPageDispatch] = usePageStateReducer('voting');
  const [myVotingPageState, myUpdateVotingPageState, myVotingPageStateReset] =
    getPageReducerPage(votingPageStateFull, votingPageDispatch, inlineInvestibleId);

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          How certain are you of voting {isFor ? 'for' : 'against'} this suggestion?
        </Typography>
        <AddEditVote
          marketId={marketId}
          wizardProps={props}
          investibleId={commentRoot.investible_id}
          groupId={commentRoot.group_id}
          hasVoted={false}
          allowMultiVote={false}
          showBudget={false}
          multiplier={isFor ? 1 : -1}
          votingPageState={myVotingPageState}
          updateVotingPageState={myUpdateVotingPageState}
          votingPageStateReset={myVotingPageStateReset}
          voteMessage={message}
          isInbox={true}
        />
      </div>
    </WizardStepContainer>
  )
}

VoteCertaintyStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

VoteCertaintyStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default VoteCertaintyStep