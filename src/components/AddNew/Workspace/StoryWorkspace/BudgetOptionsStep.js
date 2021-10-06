import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography, Card, FormControlLabel, Radio, RadioGroup, TextField } from '@material-ui/core'
import { useIntl } from 'react-intl'
import StepButtons from '../../StepButtons'
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext'
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext'
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { CommentsContext } from '../../../../contexts/CommentsContext/CommentsContext'
import { doCreateStoryWorkspace } from './workspaceCreator'
import { WizardStylesContext } from '../../WizardStylesContext'
import WizardStepContainer from '../../WizardStepContainer'
import Grid from '@material-ui/core/Grid'
import { MarketStagesContext } from '../../../../contexts/MarketStagesContext/MarketStagesContext'
import { useOptionsStyles } from './AdvancedOptionsStep'
import { OperationInProgressContext } from '../../../../contexts/OperationInProgressContext/OperationInProgressContext'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { getMarketUnits } from '../../../../contexts/MarketPresencesContext/marketPresencesHelper'
import _ from 'lodash'
import { formMarketLink } from '../../../../utils/marketIdPathFunctions'

function BudgetOptionsStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, marketStagesDispatch] = useContext(MarketStagesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);

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
    return doCreateStoryWorkspace(dispatchers, formData, updateFormData, intl)
      .then((marketId) => {
        setOperationRunning(false);
        return ({ ...formData, link: formMarketLink(marketId) });
      })
  }

  function onFinish () {
    return createMarket({ ...formData });
  }

  function onRestrictedChange (event) {
    const { value } = event.target
    updateFormData({
      isBudgetAvailable: value,
    })
  }

  function onUnitChange (event, value) {
    updateFormData({
      budgetUnit: value,
    });
  }

  const optionsClasses = useOptionsStyles();

  const {
    isBudgetAvailable,
    budgetUnit
  } = formData;

  const defaultProps = {
    options: getMarketUnits(intl),
    getOptionLabel: (option) => option,
  };

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.title} variant="h5">Budget Configuration</Typography>
        <Typography variant="body1" className={optionsClasses.helper}>
          Budgets are a way for approvers to indicate how much a story is worth. You can control whether approvers
          have the option of suggesting a budget and the units they will use.
        </Typography>
        <Card className={optionsClasses.cardStyle}>
          <Grid container spacing={2} direction="column">
            <Grid
              item
              xs={12}
              className={optionsClasses.item}
            >
              <RadioGroup value={isBudgetAvailable || 'false'} onChange={onRestrictedChange}>
                <FormControlLabel value={'false'} control={<Radio/>}
                                  label={intl.formatMessage({ id: 'BudgetRestrictYes' })}/>
                <FormControlLabel value={'true'} control={<Radio/>}
                                  label={intl.formatMessage({ id: 'BudgetRestrictNo' })}/>
              </RadioGroup>
            </Grid>
            <Grid
              item
              xs={12}
            >
              <Autocomplete
                {...defaultProps}
                id="addBudgetUnit"
                key="budgetUnit"
                freeSolo
                renderInput={(params) => <TextField {...params}
                                                    margin="dense"
                                                    label={intl.formatMessage({ id: 'addUnit' })}/>}
                value={budgetUnit}
                className={classes.maxBudgetUnit}
                onInputChange={onUnitChange}
              />
              <Typography>
                {intl.formatMessage({ id: 'budgetUnitDropdownHelp' })}
              </Typography>
            </Grid>
          </Grid>
        </Card>
        <div className={classes.borderBottom}/>
        <StepButtons
          {...props}
          validForm={isBudgetAvailable !== 'true' || !_.isEmpty(budgetUnit)}
          onNext={onFinish}
          showFinish={false}
        />
      </div>
    </WizardStepContainer>
  )
}

BudgetOptionsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

BudgetOptionsStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default BudgetOptionsStep