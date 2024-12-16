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
  Select, Tooltip, useMediaQuery, useTheme
} from '@material-ui/core';
import { useEditor } from '../../../components/TextEditors/quillHooks';
import { focusEditor, getQuillStoredState } from '../../../components/TextEditors/Utilities/CoreUtils';
import InputLabel from '@material-ui/core/InputLabel';
import { useHotkeys } from 'react-hotkeys-hook';

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
    defaultReason,
    isInbox=false
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
  function myOnChange(event) {
    onChange(event);
    focusEditor(editorName);
  }
  function simulateCertainty(key) {
    return () => {
      const target = {value: `${key}`};
      myOnChange({target});
    };
  }
  useHotkeys('ctrl+alt+1', simulateCertainty(5), {}, []);
  useHotkeys('ctrl+alt+2', simulateCertainty(25), {}, []);
  useHotkeys('ctrl+alt+3', simulateCertainty(50), {}, []);
  useHotkeys('ctrl+alt+4', simulateCertainty(75), {}, []);
  useHotkeys('ctrl+alt+5', simulateCertainty(100), {}, []);
  return (
    <div style={{paddingBottom: '0.5rem'}}>
        <FormControl className={classes.certainty}>
          {mobileLayout && (
            <>
              <InputLabel id="select-label"><FormattedMessage id='noQuantity' /></InputLabel>
              <Select
                value={newQuantity || 0}
                onChange={myOnChange}
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
              onChange={myOnChange}
              value={newQuantity || 0}
            >
              {certainties.map(certainty => {
                return (
                  <Tooltip title={<h3>
                    {intl.formatMessage({ id: `certaintyTip${certainty}` })}
                  </h3>} placement="top">
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
                  </Tooltip>
                );
              })}
            </RadioGroup>
          )}
        </FormControl>
        <div style={{paddingRight: isInbox && !mobileLayout ? '12rem' : undefined}}>
          {Editor}
        </div>
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
