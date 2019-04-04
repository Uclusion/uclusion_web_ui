import React from 'react';
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
import { getSelectedStage } from '../../store/ActiveSearches/reducer';

const styles = theme => ({
  root: {
    flex: 1,
  },
});

function MarketStageList(props) {
  const {
    marketStages,
    intl,
    marketId,
    dispatch,
    selectedStage,
    classes,
  } = props;

  function convertStagesToItems(stageList) {
    return stageList.map((stage, index) => (
      <MenuItem key={index} value={stage.id}>{stage.name}</MenuItem>
    ));
  }

  const activeStage = selectedStage && selectedStage[marketId];

  function handleChange(event) {
    const { value } = event.target;
    dispatch(changeStageSelection(value, marketId));
  }

  function getSelectList(stageItems) {
    return (
      <FormControl className={classes.root}>
        <InputLabel shrink htmlFor="adornment-stage">{intl.formatMessage({ id: 'stageSelectLabel' })}</InputLabel>
        <Select id="adornment-stage" value={activeStage || 'all'} onChange={handleChange}>
          <MenuItem value="all" disabled>
            {intl.formatMessage({ id: 'stageSelectHelper' })}
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
  return getSelectList(stageItems);
}

function mapStateToProps(state) {
  return {
    marketStages: getStages(state.marketsReducer),
    selectedStage: getSelectedStage(state.activeSearches),
  };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

MarketStageList.propTypes = {
  intl: PropTypes.object.isRequired,
  marketStages: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  dispatch: PropTypes.func.isRequired,
  selectedStage: PropTypes.object,
};

export default connect(mapStateToProps, mapDispatchToProps)(
  withStyles(styles)(injectIntl(MarketStageList)),
);
