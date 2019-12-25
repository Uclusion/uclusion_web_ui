import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useIntl } from 'react-intl';
import TextField from '@material-ui/core/TextField';
import {
  Button,
  Paper,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  Typography,
  Grid,
} from '@material-ui/core';
import { removeInvestment, updateInvestment } from '../../../api/marketInvestibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext';

function AddEditVote(props) {
  const {
    reason,
    marketId,
    investibleId,
    investment,
    onSave,
    onCancel,
    showBudget,
    storyMaxBudget,
  } = props;
  const intl = useIntl();
  const addMode = _.isEmpty(investment);
  const { quantity, max_budget: initialMaxBudget } = investment;
  const [validForm, setValidForm] = useState(false);
  const initialInvestment = (addMode) ? 50 : quantity;
  const [newQuantity, setNewQuantity] = useState(initialInvestment);
  const [maxBudget, setMaxBudget] = useState(initialMaxBudget);
  const { body, id: reasonId } = reason;
  const [reasonText, setReasonText] = useState(body);
  const [operationRunning] = useContext(OperationInProgressContext);

  useEffect(() => {
    // Long form to prevent flicker
    if ((showBudget && maxBudget > 0 && maxBudget <= storyMaxBudget) || (!showBudget)) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [showBudget, maxBudget, validForm]);

  function mySave() {
    const oldQuantity = addMode ? 0 : quantity;
    // dont include reason text if it's not changing, otherwise we'll update the reason comment
    const reasonNeedsUpdate = reasonText !== body;
    const updateInfo = {
      marketId,
      investibleId,
      newQuantity,
      currentQuantity: oldQuantity,
      newReasonText: reasonText,
      currentReasonId: reasonId,
      reasonNeedsUpdate,
      maxBudget,
    };
    return updateInvestment(updateInfo);
  }

  function onRemove() {
    return removeInvestment(marketId, investibleId);
  }

  function onChange(event) {
    const { value } = event.target;
    setNewQuantity(parseInt(value, 10));
  }

  function onBudgetChange(event) {
    const { value } = event.target;
    setMaxBudget(parseInt(value, 10));
  }

  function onEditorChange(body) {
    setReasonText(body);
  }

  return (
    <Paper>
      <FormControl
        component="fieldset"
      >
        <FormLabel component="legend">{intl.formatMessage({ id: 'certaintyQuestion' })}</FormLabel>
        <RadioGroup
          value={newQuantity}
          onChange={onChange}
        >
          <Grid
            container
            justify="space-between"
          >
            <Grid
              item
              xs={2}
            >
              <FormControlLabel
                labelPlacement="bottom"
                control={<Radio />}
                label={intl.formatMessage({ id: 'uncertain' })}
                value={0}
              />
            </Grid>
            <Grid
              item
              xs={2}
            >
              <FormControlLabel
                labelPlacement="bottom"
                control={<Radio />}
                label={intl.formatMessage({ id: 'somewhatUncertain' })}
                value={25}
              />
            </Grid>
            <Grid
              item
              xs={2}
            >
              <FormControlLabel
                labelPlacement="bottom"
                control={<Radio />}
                label={intl.formatMessage({ id: 'somewhatCertain' })}
                value={50}
              />
            </Grid>
            <Grid
              item
              xs={2}
            >
              <FormControlLabel
                labelPlacement="bottom"
                control={<Radio />}
                label={intl.formatMessage({ id: 'certain' })}
                value={75}
              />
            </Grid>
            <Grid
              item
              xs={2}
            >
              <FormControlLabel
                labelPlacement="bottom"
                control={<Radio />}
                label={intl.formatMessage({ id: 'veryCertain' })}
                value={100}
              />
            </Grid>
          </Grid>
        </RadioGroup>
      </FormControl>
      <br />
      {showBudget && (
        <TextField
          id="standard-number"
          label={intl.formatMessage({ id: 'maxBudgetInputLabel' }, { x: storyMaxBudget + 1 })}
          type="number"
          InputLabelProps={{
            shrink: true,
          }}
          variant="outlined"
          onChange={onBudgetChange}
          value={maxBudget}
          error={maxBudget > storyMaxBudget}
        />
      )}
      <Typography>{intl.formatMessage({ id: 'reasonQuestion' })}</Typography>
      <QuillEditor
        placeholder={intl.formatMessage({ id: 'yourReason' })}
        defaultValue={body}
        onChange={onEditorChange}
        uploadDisabled
      />
      <SpinBlockingButton
        marketId={marketId}
        variant="contained"
        color="primary"
        onClick={() => mySave()}
        disabled={!validForm}
        onSpinStop={onSave}
      >
        {addMode ? intl.formatMessage({ id: 'saveVote' }) : intl.formatMessage({ id: 'updateVote' })}
      </SpinBlockingButton>
      {addMode && (
        <Button disabled={operationRunning} onClick={() => onCancel()}>
          {intl.formatMessage({ id: 'cancelVote' })}
        </Button>
      )}
      {!addMode && (
        <SpinBlockingButton
          marketId={marketId}
          variant="contained"
          color="primary"
          onClick={() => onRemove()}
          onSpinStop={onSave}
        >
          {intl.formatMessage({ id: 'removeVote' })}
        </SpinBlockingButton>
      )}
    </Paper>
  );
}

AddEditVote.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  reason: PropTypes.object,
  showBudget: PropTypes.bool,
  storyMaxBudget: PropTypes.number.isRequired,
  marketId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investment: PropTypes.object,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
};

AddEditVote.defaultProps = {
  showBudget: false,
  investment: {},
  onSave: () => {},
  onCancel: () => {},
  reason: {},
};

export default AddEditVote;
