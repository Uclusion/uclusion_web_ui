import React from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  FormControl,
  FormControlLabel,
  makeStyles,
  MenuItem,
  Radio,
  RadioGroup,
  Select, useMediaQuery, useTheme
} from '@material-ui/core';
import { useEditor } from '../../../components/TextEditors/quillHooks';
import { getQuillStoredState } from '../../../components/TextEditors/Utilities/CoreUtils';
import InputLabel from '@material-ui/core/InputLabel';

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
      certainty: {
        [theme.breakpoints.down('sm')]: {
          width: '15rem'
        }
      },
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
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const classes = useStyles();
  const editorSpec = {
    marketId,
    placeholder: intl.formatMessage({ id: "yourReason" }),
    value: getQuillStoredState(editorName) || defaultReason,
    onUpload,
    onChange: onEditorChange,
  };
  const [Editor] = useEditor(editorName, editorSpec);
  const certainties = [5, 25, 50, 75, 100];
  return (
    <div style={{paddingBottom: '0.5rem'}}>
        <FormControl className={classes.certainty}>
          {mobileLayout && (
            <>
              <InputLabel id="select-label"><FormattedMessage id='noQuantity' /></InputLabel>
              <Select
                value={newQuantity || 0}
                onChange={onChange}
                label={<FormattedMessage id='noQuantity' />}
              >
                {certainties.map(certainty => {
                  return ( <MenuItem
                    key={certainty}
                    value={certainty}
                  >
                    {<FormattedMessage id={`certainty${certainty}`} />}
                  </MenuItem> );
                })}
              </Select>
            </>
          )}
          {mobileLayout && (
            <div style={{marginBottom: '1rem'}}/>
          )}
          {!mobileLayout && (
            <RadioGroup
              aria-labelledby="add-vote-certainty"
              className={classes.certaintyGroup}
              onChange={onChange}
              value={newQuantity || 0}
            >
              {certainties.map(certainty => {
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
          )}
        </FormControl>
        {Editor}
    </div>
  );
}

AddInitialVote.propTypes = {
  marketId: PropTypes.string.isRequired,
  onChange: PropTypes.func.isRequired,
  onEditorChange: PropTypes.func,
  newQuantity: PropTypes.number,
  body: PropTypes.string
};

export default AddInitialVote;
