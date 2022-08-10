import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography, Card } from '@material-ui/core'
import StepButtons from '../StepButtons';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepContainer from '../WizardStepContainer';
import Grid from '@material-ui/core/Grid';
import AllowedInProgress from '../../../pages/Dialog/Planning/AllowedInProgress';
import ShowInVerifiedStageAge from '../../../pages/Dialog/Planning/ShowInVerifiedStageAge'
import { useOptionsStyles } from './AdvancedOptionsStep'


function SwimlanesOptionsStep (props) {
  const { updateFormData, formData } = props;
  const classes = useContext(WizardStylesContext);

  function handleChange (name) {
    return (event) => {
      const { value } = event.target;
      const parsed = parseInt(value, 10);
      updateFormData({
        [name]: parsed,
      });
    };
  }

  const optionsClasses = useOptionsStyles();

  const {
    allowedInvestibles,
    showInvestiblesAge
  } = formData;

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.title} variant="h5">Swimlane Configuration</Typography>
        <Typography variant="body1" className={optionsClasses.helper}>
          Limiting the number of jobs a person can start helps clarify status.
          Recently finished jobs show in the swimlanes but you can see all Verified stage jobs by looking in "Archives".
        </Typography>
        <Card className={optionsClasses.cardStyle}>
          <Grid container spacing={2} direction="column">
            <Grid
              item
              xs={12}
              className={optionsClasses.item}
            >
              <AllowedInProgress
                onChange={handleChange('allowedInvestibles')}
                value={allowedInvestibles}
              />
            </Grid>
            <Grid
              item
              xs={12}
              className={optionsClasses.item}
            >
              <ShowInVerifiedStageAge
                onChange={handleChange('showInvestiblesAge')}
                value={showInvestiblesAge}
              />
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

SwimlanesOptionsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

SwimlanesOptionsStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default SwimlanesOptionsStep;