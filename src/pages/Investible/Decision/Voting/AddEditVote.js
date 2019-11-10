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
  Typography
} from '@material-ui/core';
import { updateInvestment } from '../../../../api/marketInvestibles';
import QuillEditor from '../../../../components/TextEditors/QuillEditor';
import { saveComment, updateInvestmentReason } from '../../../../api/comments';
import { JUSTIFY_TYPE } from '../../../../containers/CommentBox/CommentBox';

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
  const noPreviousReason = _.isEmpty(reason);
  const { body, id: reasonId } = reason;
  const [reasonText, setReasonText] = useState(body);

  function mySave() {
    const oldQuantity = addMode ? 0 : quantity;
    return updateInvestment(marketId, investibleId, newQuantity, oldQuantity)
      .then(() => {
        // do we need to save a reason?
        if (reasonText) {
          if (noPreviousReason) {
            return saveComment(marketId, investibleId, undefined, reasonText, JUSTIFY_TYPE, []);
          }
          return updateInvestmentReason(marketId, reasonId, reasonText, []);
        }
        return Promise.resolve(true);
      }).then(() => {
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
          <FormControlLabel control={<Radio />} label="Completely Uncertain" value={0} />
          <FormControlLabel control={<Radio />} label="Mostly Uncertain" value={25} />
          <FormControlLabel control={<Radio />} label="Neutral Certainty" value={50} />
          <FormControlLabel control={<Radio />} label="Mostly Certain" value={75} />
          <FormControlLabel control={<Radio />} label="Completely Certain" value={100} />
        </RadioGroup>
      </FormControl>
      <Typography>Why did you vote for this option?</Typography>
      <QuillEditor
        placeholder="Your reason..."
        onChange={onEditorChange}
        uploadDisabled
      />
      <Button
        onClick={() => mySave()}
      >
        Save Vote
      </Button>
      {addMode && <Button onClick={() => onCancel()}> Cancel Vote</Button>}
    </Paper>
  );
}

AddEditVote.propTypes = {
  reason: PropTypes.object,
  marketId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  investment: PropTypes.object,
  onSave: PropTypes.func,
};

AddEditVote.defaultProps = {
  investment: {},
  onSave: () => {},
  reason: {},
};

export default AddEditVote;