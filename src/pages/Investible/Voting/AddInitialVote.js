import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import { FormControl, FormControlLabel, FormLabel, makeStyles, Radio, RadioGroup } from '@material-ui/core';
import { useEditor } from '../../../components/TextEditors/quillHooks';
import { getQuillStoredState } from '../../../components/TextEditors/Utilities/CoreUtils';

const useStyles = makeStyles(
  theme => {
    return {
      sideBySide: {
        display: 'flex',
      },
      overTop: {
        display: 'flex',
        paddingBottom: '3px',
      },
      maxBudgetUnit: {
        width: 230
      },
      certainty: {},
      certaintyGroup: {
        display: "flex",
        flexDirection: "row"
      },
      certaintyLabel: {
        marginBottom: theme.spacing(2),
        textTransform: "capitalize"
      },
      certaintyValue: {
        borderRadius: 6,
        paddingLeft: theme.spacing(1),
        margin: theme.spacing(0, 2, 2, 0)
      },
      certaintyValueLabel: {
        fontWeight: "bold"
      },
      divider: {
        margin: theme.spacing(2, 0)
      },
      maxBudget: {
        display: "block"
      },
    };
  },
  { name: "VoteAdd" }
);

function AddInitialVote(props) {
  const {
    marketId,
    onUpload,
    onChange,
    newQuantity,
    onEditorChange,
    editorName,
    defaultReason
  } = props;
  const intl = useIntl();
  const classes = useStyles();

  const editorSpec = {
    marketId,
    placeholder: intl.formatMessage({ id: "yourReason" }),
    value: getQuillStoredState(editorName) || defaultReason,
    onUpload,
    onChange: onEditorChange,
  };
  const [Editor] = useEditor(editorName, editorSpec);

  return (
    <div style={{paddingBottom: '0.5rem'}}>
        <FormControl className={classes.certainty}>
          <FormLabel
            className={classes.certaintyLabel}
            id="add-vote-certainty"
          >
          </FormLabel>
          <RadioGroup
            aria-labelledby="add-vote-certainty"
            className={classes.certaintyGroup}
            onChange={onChange}
            value={newQuantity || 0}
          >
            {[5, 25, 50, 75, 100].map(certainty => {
              return (
                <FormControlLabel
                  key={certainty}
                  id={`${certainty}`}
                  className={classes.certaintyValue}
                  classes={{
                    label: classes.certaintyValueLabel
                  }}
                  /* prevent clicking the label stealing focus */
                  onMouseDown={e => e.preventDefault()}
                  control={<Radio />}
                  label={<FormattedMessage id={`certainty${certainty}`} />}
                  labelPlacement="start"
                  value={certainty}
                />
              );
            })}
          </RadioGroup>
        </FormControl>
        {Editor}
    </div>
  );
}

AddInitialVote.propTypes = {
  showBudget: PropTypes.bool.isRequired,
  marketId: PropTypes.string.isRequired,
  onBudgetChange: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  onEditorChange: PropTypes.func,
  newQuantity: PropTypes.number,
  maxBudget: PropTypes.any,
  maxBudgetUnit: PropTypes.any,
  body: PropTypes.string
};

export default AddInitialVote;
