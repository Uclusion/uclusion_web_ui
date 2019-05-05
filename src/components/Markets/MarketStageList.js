import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';

import { changeStageSelection } from '../../store/ActiveSearches/actions';
import { getStages } from '../../store/Markets/reducer';

const styles = theme => ({
  root: {
    flex: 1,
  },
});

function MarketStageList(props) {
  const [activeStage, setActiveStage] = useState(undefined);
  const {
    marketStages,
    intl,
    marketId,
    dispatch,
    classes,
  } = props;

  function getCompleteStages(stageList) {
    return stageList.filter((stage) => {
      return !stage.appears_in_market_summary;
    });
  }
  function convertStagesToItems(stageList) {
    const items = stageList.map((stage, index) => (
      <MenuItem key={index} value={stage.id}>{stage.name}</MenuItem>
    ));
    const completeStages = getCompleteStages(stageList);
    const completeItems = completeStages.map((stage, index) => (
      <MenuItem key={`complete${index}`} value={`not_${stage.id}`}>{intl.formatMessage({ id: 'stageNotHelper' }) + stage.name}</MenuItem>
    ));
    items.push(...completeItems);
    return items;
  }

  function handleChange(event) {
    const { value } = event.target;
    setActiveStage(value);
    // we map 'unselected' to undefined in order to zero out the selection in the reducer without
    const realValue = value === 'unselected' ? undefined : value;
    dispatch(changeStageSelection(realValue, marketId));
  }

  function getSelectList(stageItems, defaultSelected) {
    return (
      <FormControl className={classes.root}>
        <InputLabel shrink htmlFor="adornment-stage">{intl.formatMessage({ id: 'stageSelectLabel' })}</InputLabel>
        <Select id="adornment-stage" value={activeStage || defaultSelected} onChange={handleChange}>
          <MenuItem value="helper" disabled>
            {intl.formatMessage({ id: 'stageSelectHelper' })}
          </MenuItem>
          <MenuItem value="unselected">
            {intl.formatMessage({ id: 'stageSelectAllStages' })}
          </MenuItem>
          {stageItems}
        </Select>
      </FormControl>
    );
  }

  const stages = marketStages && marketStages[marketId];
  // const allStages = { id: 'all', name: intl.formatMessage({ id: 'stageSelectAllStages' }) };
  // let stageList = [allStages];
  let stageList = [];
  if (stages) {
    stageList = stageList.concat(stages);
  }
  const stageItems = convertStagesToItems(stageList);
  let defaultSelected = 'unselected';
  const completed = getCompleteStages(stageList);
  if (completed.length > 0) {
    defaultSelected = `not_${completed[0].id}`;
  }
  return getSelectList(stageItems, defaultSelected);
}

function mapStateToProps(state) {
  return {
    marketStages: getStages(state.marketsReducer),
  };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

MarketStageList.propTypes = {
  intl: PropTypes.object.isRequired,
  marketStages: PropTypes.object.isRequired,
  marketId: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(
  withStyles(styles)(injectIntl(MarketStageList)),
);
