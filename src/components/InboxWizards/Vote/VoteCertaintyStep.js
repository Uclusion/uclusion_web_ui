import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer'
import { wizardStyles } from '../WizardStylesContext'
import AddEditVote from '../../../pages/Investible/Voting/AddEditVote'
import { getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import _ from 'lodash';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { dismissWorkListItem } from '../../../pages/Home/YourWork/WorkListItem';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { useHistory } from 'react-router';

function VoteCertaintyStep(props) {
  const { formData, updateFormData, commentRoot, message } = props;
  const history = useHistory();
  const classes = wizardStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);
  const { isFor } = formData;
  const { inline_market_id: inlineMarketId } = commentRoot;
  const investibles = getMarketInvestibles(investiblesState, inlineMarketId);

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText} variant="h6">
          How certain are you of voting {isFor ? 'for' : 'against'} this suggestion?
        </Typography>
        {!_.isEmpty(investibles) && (
          <AddEditVote
            marketId={inlineMarketId}
            wizardProps={{...props, finish: () => dismissWorkListItem(message, messagesDispatch, history)}}
            investibleId={investibles[0].investible.id}
            groupId={inlineMarketId}
            hasVoted={false}
            allowMultiVote={false}
            multiplier={isFor ? 1 : -1}
            formData={formData}
            updateFormData={updateFormData}
            voteMessage={message}
            isInbox={true}
          />
        )}
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