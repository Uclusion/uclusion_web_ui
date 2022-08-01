import React, { useContext } from 'react';
import PropTypes from 'prop-types'
import { Typography, Card, FormControlLabel, Radio, RadioGroup } from '@material-ui/core'
import { useIntl } from 'react-intl'
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
import { VoteExpiration, Votes } from '../../AgilePlan'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { useOptionsStyles } from './AdvancedOptionsStep'
import { formMarketLink } from '../../../utils/marketIdPathFunctions'

function ApprovalOptionsStep (props) {
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
          onFinish={onFinish}
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