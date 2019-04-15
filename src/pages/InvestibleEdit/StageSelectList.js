import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { InputLabel, withStyles } from '@material-ui/core';
import Select from '@material-ui/core/Select';
import MenuItem from '@material-ui/core/MenuItem';
import FormControl from '@material-ui/core/FormControl';
import { getStages } from '../../store/Markets/reducer';

const styles = theme => ({
  root: {
    flex: 1,
  },
});

function StageSelectList(props) {
  const {
    marketStages,
    intl,
    marketId,
    classes,
    onChange,
    value,
    label,
  } = props;

  function convertStagesToItems(stageList) {
    return stageList.map((stage, index) => (
      <MenuItem key={index} value={stage.id}>{stage.name}</MenuItem>
    ));
  }



  function getSelectList(stageItems) {
    return (
      <FormControl className={classes.root}>
        <InputLabel shrink>{label}</InputLabel>
        <Select id="adornment-stage" value={value} onChange={onChange}>
          <MenuItem value="helper" disabled>
            {intl.formatMessage({ id: 'investibleEditStageHelper' })}
          </MenuItem>
          {stageItems}
        </Select>
      </FormControl>
    );
  }
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

StageSelectList.propTypes = {
  intl: PropTypes.object.isRequired,
  marketStages: PropTypes.object.isRequired,  //eslint-disable-line
  marketId: PropTypes.string,
  dispatch: PropTypes.func.isRequired,
  label: PropTypes.string.isRequired,
};

export default connect(mapStateToProps, mapDispatchToProps)(
  withStyles(styles)(injectIntl(StageSelectList)),
);
