import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography, FormControlLabel, Radio, RadioGroup } from '@material-ui/core'
import { useIntl } from 'react-intl'
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepContainer from '../WizardStepContainer';
import { VoteExpiration, Votes } from '../../AgilePlan'
import WizardStepButtons from '../WizardStepButtons';

function ApprovalOptionsStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);

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
    investmentExpiration,
    votesRequired,
    assignedCanApprove
  } = formData

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText}>How should job approvals work?</Typography>
              <VoteExpiration
                onChange={handleChange('investmentExpiration')}
                value={investmentExpiration}
              />
              <Votes onChange={handleChange('votesRequired')} value={votesRequired}/>
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
          finishLabel='GroupWizardGotoGroup'
        />
      </div>
    </WizardStepContainer>
  );
}

ApprovalOptionsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

ApprovalOptionsStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default ApprovalOptionsStep;