import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Typography, Card, FormControlLabel, Radio, RadioGroup, TextField } from '@material-ui/core'
import { useIntl } from 'react-intl'
import StepButtons from '../StepButtons'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { doCreateGroup } from './groupCreator'
import { WizardStylesContext } from '../WizardStylesContext'
import WizardStepContainer from '../WizardStepContainer'
import Grid from '@material-ui/core/Grid'
import { useOptionsStyles } from './AdvancedOptionsStep'
import Autocomplete from '@material-ui/lab/Autocomplete'
import { getMarketUnits } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import _ from 'lodash'
import { formMarketLink } from '../../../utils/marketIdPathFunctions'
import { MarketGroupsContext } from '../../../contexts/MarketGroupsContext/MarketGroupsContext'
import { GroupMembersContext } from '../../../contexts/GroupMembersContext/GroupMembersContext'

function BudgetOptionsStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, groupsDispatch] = useContext(MarketGroupsContext);
  const [, groupMembersDispatch] = useContext(GroupMembersContext);

  function createGroup(formData) {
    const dispatchers = {
      groupsDispatch,
      diffDispatch,
      groupMembersDispatch
    };
    return doCreateGroup(dispatchers, formData, updateFormData)
      .then((group) => {
        return ({ ...formData, link: formMarketLink(group.market_id, group.id) });
      })
  }

  function onFinish () {
    return createGroup({ ...formData });
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
          Budgets are a way for approvers to indicate how much a job is worth. You can control whether approvers
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