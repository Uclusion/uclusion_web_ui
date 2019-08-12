import React from 'react';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import TextField from '@material-ui/core/TextField';
import { connect } from 'react-redux';
import { injectIntl } from 'react-intl';
import InputAdornment from '@material-ui/core/InputAdornment';
import { IconButton, Button } from '@material-ui/core';

import { updateInvestment } from '../../api/marketInvestibles';
import { Add, Remove } from '@material-ui/icons';

const styles = theme => ({

  container: {
    display: 'flex',
    alignItems: 'flex-end',
  },
  textField: {
    marginLeft: theme.spacing.unit,
    marginRight: theme.spacing(2),
    width: 100,
  },
  investButton: {
    marginLeft: theme.spacing.unit,
    marginBottom: theme.spacing.unit,
  },
  availableShares: {
    fontSize: 14,
    paddingLeft: theme.spacing.unit,
  },
  button: {
    marginLeft: theme.spacing.unit,
    marginBottom: theme.spacing(2),
    padding: 0,
  },
});

function InvestibleInvest(props){

  const {
    marketId,
    investibleId,
    teamId,
    dispatch,
    currentUserInvestment,
    sharesAvailable,
    classes,
    intl,
    setQuantityToInvest,
    quantityToInvest,
  } = props;


  function doInvestment() {
    const quantity = parseInt(quantityToInvest, 10);
    updateInvestment(teamId, marketId, investibleId, quantity, currentUserInvestment, dispatch);
  }

  function checkQuantity(newQuantity) {
    const numValue = isNaN(newQuantity) ? parseInt(newQuantity, 10) : newQuantity;
    const invalid = (!isNaN(numValue) && (numValue < 0 || numValue > sharesAvailable));
    return !invalid;
  }

  function updateState(newQuantity) {
    const valid = checkQuantity(newQuantity);
    if (valid) {
      const numValue = isNaN(newQuantity) ? parseInt(newQuantity, 10) : newQuantity;
      setQuantityToInvest(numValue);
    } else {
    }
  }

  function handleQuantityChange(event) {
    const { value } = event.target;
    updateState(value);
  }

  function addClicked() {
    const newQuantity = quantityToInvest + 1;
    updateState(newQuantity);
  }

  function deleteClicked() {
    const newQuantity = quantityToInvest - 1;
    updateState(newQuantity);
  }

  return (
    <div>

      <form className={classes.container} noValidate autoComplete="off" onSubmit={e => e.preventDefault()}>

        <IconButton onClick={deleteClicked}>
          <Remove/>
        </IconButton>

        <TextField
          id="quantityToInvest"
          label={intl.formatMessage({ id: 'investModalQuantityLabel' })}
          className={classes.textField}
          margin="normal"
          type="number"
          value={quantityToInvest}
          onChange={handleQuantityChange}
          InputProps={{
            startAdornment: (
              <InputAdornment
                style={{ paddingBottom: 4 }}
                position="start"
              >
                Ȗ
              </InputAdornment>
            ),
          }}
        />
        <IconButton onClick={addClicked}>
          <Add/>
        </IconButton>
        {(currentUserInvestment != quantityToInvest) && //eslint-disable-line
        <Button
          className={classes.investButton}
          variant="contained"
          color="primary"
          onClick={doInvestment}>
          {intl.formatMessage({ id: 'investButton' })}
        </Button>
        }
      </form>
    </div>
  );
}

InvestibleInvest.propTypes = {
  classes: PropTypes.object.isRequired, //eslint-disable-line
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  teamId: PropTypes.string.isRequired,
  sharesAvailable: PropTypes.number.isRequired,
  dispatch: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired, //eslint-disable-line
  currentUserInvestment: PropTypes.number.isRequired,
};

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapDispatchToProps)(injectIntl(withStyles(styles)(InvestibleInvest)));
