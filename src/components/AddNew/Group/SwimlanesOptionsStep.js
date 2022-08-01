import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography, Card } from '@material-ui/core'
import { useIntl } from 'react-intl';
import StepButtons from '../StepButtons';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';

import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { doCreateGroup } from './groupCreator';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepContainer from '../WizardStepContainer';
import Grid from '@material-ui/core/Grid';
import AllowedInProgress from '../../../pages/Dialog/Planning/AllowedInProgress';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import ShowInVerifiedStageAge from '../../../pages/Dialog/Planning/ShowInVerifiedStageAge'
import { useOptionsStyles } from './AdvancedOptionsStep'
import { formMarketLink } from '../../../utils/marketIdPathFunctions'


function SwimlanesOptionsStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, marketStagesDispatch] = useContext(MarketStagesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);

  function createMarket (formData) {
    const dispatchers = {
      marketStagesDispatch,
      diffDispatch,
      investiblesDispatch,
      marketsDispatch,
      presenceDispatch,
      commentsDispatch,
      commentsState,
    };
    return doCreateGroup(dispatchers, formData, updateFormData, intl)
      .then((marketId) => {
        return ({ ...formData, link: formMarketLink(marketId, marketId) });
      });
  }

  function onFinish() {
    return createMarket({ ...formData });
  }

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
          onFinish={onFinish}
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