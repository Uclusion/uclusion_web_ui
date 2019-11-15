import React, { useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
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
import { updateInvestment } from '../../../../api/marketInvestibles';
import QuillEditor from '../../../../components/TextEditors/QuillEditor';

function AddEditVote(props) {
  const {
    reason,
    marketId,
    investibleId,
    investment,
    onSave,
    onCancel,
  } = props;

  const addMode = _.isEmpty(investment);
  const { quantity } = investment;
  const initialInvestment = (addMode) ? 50 : quantity;
  const [newQuantity, setNewQuantity] = useState(initialInvestment);
  const { body, id: reasonId } = reason;
  console.log(reason);
  const [reasonText, setReasonText] = useState(body);

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
    };
    return updateInvestment(updateInfo)
      .then(() => {
        onSave();
      });
  }

  function onChange(event) {
    const { value } = event.target;
    setNewQuantity(parseInt(value, 10));
  }

  function onEditorChange(body) {
    setReasonText(body);
  }

  return (
    <Paper>
      <FormControl
        component="fieldset"
      >
        <FormLabel component="legend">How certain are you of your vote?</FormLabel>
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
              <FormControlLabel labelPlacement="bottom" control={<Radio />} label="Uncertain" value={0} />
            </Grid>
            <Grid
              item
              xs={2}
            >
              <FormControlLabel labelPlacement="bottom" control={<Radio />} value={25} />
            </Grid>
            <Grid
              item
              xs={2}
            >
              <FormControlLabel labelPlacement="bottom" control={<Radio />}value={50} />
            </Grid>
            <Grid
              item
              xs={2}
            >
              <FormControlLabel labelPlacement="bottom" control={<Radio />}value={75} />
            </Grid>
            <Grid
              item
              xs={2}
            >
              <FormControlLabel labelPlacement="bottom" control={<Radio />} label="Certain" value={100} />
            </Grid>
          </Grid>
        </RadioGroup>
      </FormControl>
      <Typography>Why did you vote for this option?</Typography>
      <QuillEditor
        placeholder="Your reason..."
        defaultValue={body}
        onChange={onEditorChange}
        uploadDisabled
      />
      <Button
        onClick={() => mySave()}
      >
        {addMode ? 'Save Vote' : 'Update Vote'}
      </Button>
      {addMode && <Button onClick={() => onCancel()}> Cancel Vote</Button>}
    </Paper>
  );
}

AddEditVote.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  reason: PropTypes.object,
  marketId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investment: PropTypes.object,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
};

AddEditVote.defaultProps = {
  investment: {},
  onSave: () => {},
  onCancel: () => {},
  reason: {},
};

export default AddEditVote;