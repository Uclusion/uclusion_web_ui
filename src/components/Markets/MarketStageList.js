import React, { useState } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getStages } from '../../store/Markets/reducer';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import InputLabel from '@material-ui/core/InputLabel';
// import Input from '@material-ui/core/Input';
import { FormHelperText } from '@material-ui/core';
import { injectIntl } from 'react-intl';

function MarketStageList(props) {
  const { onChange, marketStages, intl, marketId } = props;
  const [selectedStage, setSelectedStage] = useState('all');

  function convertStagesToItems(stageList) {
    const items = stageList.map(stage => <MenuItem key={stage.id} value={stage.id}>stage.name</MenuItem>);
    return items;
  }

  function handleChange(event) {
    const { value } = event.target;
    setSelectedStage(value);
    onChange(value);
  }



  function getSelectList(stageItems) {
    return (
      <FormControl>
        <InputLabel shrink>{intl.formatMessage({ id: 'stageSelectLabel'})}</InputLabel>
        <Select value={selectedStage} onChange={handleChange}>
          {stageItems}
        </Select>
        <FormHelperText>{intl.formatMessage({id: 'stageSelectHelper'})}</FormHelperText>
      </FormControl>);
  }

  const stages = marketStages[marketId];
  const allStages = <MenuItem key='all' value='all'>{intl.formatMessage({ id: 'stageSelectAllStages' })}</MenuItem>;
  let stageList = [allStages];
  if (stages) {
    const stageItems = convertStagesToItems(stageList);
    stageList = stageList.concat(stageItems);
  }
  return getSelectList(stageList);
}

function mapStateToProps(state) {
  return {
    marketStages: getStages(state.marketsReducer),
  }; // not used yet
}

MarketStageList.propTypes = {
  intl: PropTypes.object.isRequired,
  marketStages: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,

};

export default connect(mapStateToProps)(injectIntl(MarketStageList));

