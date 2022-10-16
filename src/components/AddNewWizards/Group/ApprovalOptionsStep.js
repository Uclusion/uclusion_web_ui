import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography, FormControlLabel, Radio, RadioGroup, TextField } from '@material-ui/core'
import { useIntl } from 'react-intl'
import { WizardStylesContext } from '../WizardStylesContext'
import WizardStepContainer from '../WizardStepContainer'
import WizardStepButtons from '../WizardStepButtons'

function ApprovalOptionsStep (props) {
  const { updateFormData, formData } = props
  const intl = useIntl()
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

  function onRestrictedChange (event) {
    const { value } = event.target
    updateFormData({
      assignedCanApprove: value,
    })
  }

  const {
    votesRequired,
    assignedCanApprove,
  } = formData

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
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
        <RadioGroup value={assignedCanApprove || 'false'} onChange={onRestrictedChange}>
          <FormControlLabel value={'false'} control={<Radio/>}
                            label={intl.formatMessage({ id: 'ApprovalRestrictYes' })}/>
          <FormControlLabel value={'true'} control={<Radio/>}
                            label={intl.formatMessage({ id: 'ApprovalRestrictNo' })}/>
        </RadioGroup>
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          showFinish={true}
          finishLabel="GroupWizardGotoGroup"
        />
      </div>
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