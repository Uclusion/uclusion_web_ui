import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
import { changeStageSelection } from '../../store/ActiveSearches/actions';
import { getStages } from '../../store/Markets/reducer';
import { getSelectedStage } from '../../store/ActiveSearches/reducer';

function MarketStageList(props) {
  const { marketStages, intl, marketId, dispatch, selectedStage } = props;

  function convertStagesToItems(stageList) {
    const items = stageList.map((stage, index) => <MenuItem key={index} value={stage.id}>{stage.name}</MenuItem>);
    return items;
  }

  const activeStage = selectedStage && selectedStage[marketId];

  function handleChange(event) {
    const { value } = event.target;
    const actualValue = value === 'all' ? undefined : value;
    dispatch(changeStageSelection(actualValue, marketId));
  }

  function getSelectList(stageItems) {
    return (
      <FormControl>
        <InputLabel shrink>{intl.formatMessage({ id: 'stageSelectHelper' })}</InputLabel>
        <Select value={ activeStage || 'all'} onChange={handleChange}>
          {stageItems}
        </Select>
      </FormControl>);
  }

  const stages = marketStages && marketStages[marketId];
  const allStages = { id: 'all', name: intl.formatMessage({ id: 'stageSelectAllStages' }) };
  let stageList = [allStages];
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
  }; // not used yet
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

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(MarketStageList));

