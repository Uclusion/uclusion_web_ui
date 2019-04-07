import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import { getStages } from '../../store/Markets/reducer';

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
    classes,
    onChange,
    value,
  } = props;

  function convertStagesToItems(stageList) {
    return stageList.map((stage, index) => (
      <MenuItem key={index} value={stage.id}>{stage.name}</MenuItem>
    ));
  }

  function handleChange(event) {
    const { value } = event.target;
    onChange(value);
  }

  function getSelectList(stageItems) {
    return (
      <FormControl className={classes.root}>
        <Select id="adornment-stage" value={value} onChange={handleChange}>
          <MenuItem value="helper" disabled>
            {intl.formatMessage({ id: 'investibleEditStageHelper' })}
          </MenuItem>
          {stageItems}
        </Select>
      </FormControl>
    );
  }
  console.log(marketId);
  const stages = (marketStages && marketStages[marketId]) || [];
  const stageItems = convertStagesToItems(stages);
  return getSelectList(stageItems);
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
  marketStages: PropTypes.object.isRequired,  //eslint-disable-line
  marketId: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(
  withStyles(styles)(injectIntl(MarketStageList)),
);
