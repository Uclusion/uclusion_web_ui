import React from 'react'
import PropTypes from 'prop-types'
import { Typography } from '@material-ui/core'
import WizardStepContainer from '../WizardStepContainer'
import { wizardStyles } from '../WizardStylesContext'
import AddEditVote from '../../../pages/Investible/Voting/AddEditVote'

function VoteCertaintyStep(props) {
  const { marketId, formData, updateFormData, clearFormData, commentRoot, message } = props;
  const classes = wizardStyles();
  const { isFor } = formData;

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
          multiplier={isFor ? 1 : -1}
          formData={formData}
          updateFormData={updateFormData}
          clearFormData={clearFormData}
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