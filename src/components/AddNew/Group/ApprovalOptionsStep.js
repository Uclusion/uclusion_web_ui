import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography, Card, FormControlLabel, Radio, RadioGroup } from '@material-ui/core'
import { useIntl } from 'react-intl'
import StepButtons from '../StepButtons';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepContainer from '../WizardStepContainer';
import Grid from '@material-ui/core/Grid';
import { VoteExpiration, Votes } from '../../AgilePlan'
import { useOptionsStyles } from './AdvancedOptionsStep'

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

  const optionsClasses = useOptionsStyles()

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
        <Typography className={classes.title} variant="h5">Approval Configuration</Typography>
        <Typography variant="body1" className={optionsClasses.helper}>
          You can control how many approvals a job requires, how long they last and whether assigned can approve.
        </Typography>
        <Card className={optionsClasses.cardStyle}>
          <Grid container spacing={2} direction="column">
            <Grid
              item
              xs={12}
              className={optionsClasses.item}
            >
              <VoteExpiration
                onChange={handleChange('investmentExpiration')}
                value={investmentExpiration}
              />
            </Grid>
            <Grid
              item
              xs={12}
              className={optionsClasses.item}
            >
              <Votes onChange={handleChange('votesRequired')} value={votesRequired}/>
            </Grid>
            <Grid
              item
              xs={12}
              className={optionsClasses.item}
            >
              <RadioGroup value={assignedCanApprove || 'false'} onChange={onRestrictedChange}>
                <FormControlLabel value={'false'} control={<Radio/>}
                                  label={intl.formatMessage({ id: 'ApprovalRestrictYes' })}/>
                <FormControlLabel value={'true'} control={<Radio/>}
                                  label={intl.formatMessage({ id: 'ApprovalRestrictNo' })}/>
              </RadioGroup>
            </Grid>
          </Grid>
        </Card>
        <div className={classes.borderBottom}/>
        <StepButtons
          {...props}
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