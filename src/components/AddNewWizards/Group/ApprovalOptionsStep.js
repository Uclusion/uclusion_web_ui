import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography, TextField } from '@material-ui/core'

import { WizardStylesContext } from '../WizardStylesContext'
import WizardStepContainer from '../WizardStepContainer'
import WizardStepButtons from '../WizardStepButtons'
import { updateGroup } from '../../../api/markets'

function ApprovalOptionsStep (props) {
  const { updateFormData, formData, marketId } = props

  const classes = useContext(WizardStylesContext)

  function handleChange (name) {
    return (event) => {
      const { value } = event.target
      const parsed = parseInt(value, 10)
      updateFormData({
        [name]: Number.isNaN(parsed) ? '' : parsed,
      })
    }
  }

  function onNext(){
    const {groupId, votesRequired} = formData;
    return updateGroup({marketId, groupId, votesRequired})
      .then(() => {
        return {link: formData.link};
      })
  }

  const {
    votesRequired,
  } = formData

  return (
    <WizardStepContainer
      {...props}
    >
        <Typography className={classes.introText}>How should job approvals work?</Typography>
        <div className={classes.inlineInputContainer}>
          <Typography>A job can start once</Typography>
          <TextField
            className={classes.inlineInputBox}
            variant="outlined"
            inputProps={{ size: 3 }}
            max={99}
            min={0}
            value={votesRequired ?? 1}
            size="small"
            onChange={handleChange('votesRequired')}
          />
          <Typography>people approve.</Typography>
        </div>
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          showNext={true}
          onNext={onNext}
          nextLabel="GroupWizardGotoGroup"
        />
    </WizardStepContainer>
  )
}

ApprovalOptionsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

ApprovalOptionsStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default ApprovalOptionsStep