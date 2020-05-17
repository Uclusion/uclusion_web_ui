import React, { useState } from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  makeStyles,
  Radio,
  RadioGroup,
  Tooltip
} from '@material-ui/core'
import clsx from 'clsx';
import CommentAdd from '../../components/Comments/CommentAdd'
import { FormattedMessage } from 'react-intl'
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../constants/comments'

export const useStyles = makeStyles((theme) => ({
  hidden: {
    display: 'none',
  },
  addBox: {},
  commentType: {},
  commentTypeGroup: {
    display: "flex",
    flexDirection: "row"
  },
  chipItem: {
    color: '#fff',
    borderRadius: '8px',
    '& .MuiChip-label': {
      fontSize: 12,
    },
    '& .MuiFormControlLabel-label': {
      paddingRight: '5px',
      fontWeight: 'bold',
      textTransform: 'capitalize'
    },
    '& .MuiChip-avatar': {
      width: '16px',
      height: '14px',
      color: '#fff',
    },
    '& .MuiRadio-colorPrimary.Mui-checked':{
      '&.Mui-checked': {
        color: 'white'
      }
    },
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    margin: theme.spacing(0, 0, 0, 4)
  },
  selected: {
    opacity: 1
  },
  unselected: {
    opacity: '.6'
  },
  chipItemQuestion: {
    background: '#2F80ED',
  },
  chipItemIssue: {
    background: '#E85757',
    color: 'black'
  },
  chipItemSuggestion: {
    background: '#e6e969',
    color: 'black'
  },
  chipItemTodo: {
    background: '#F29100',
    color: 'black'
  },
  chipItemFor: {
    background: '#73B76C',
  },
  chipItemAgainst: {
    background: '#D54F22',
  },
  chipItemReport: {
    background: '#73B76C',
  },
}));


function CommentAddBox(props) {
  const {
    marketId,
    investible,
    allowedTypes,
    onSave,
    issueWarningId,
  } = props;
  const [type, setType] = useState('');
  const classes = useStyles();
  function onTypeChange(event) {
    const { value } = event.target;
    setType(value);
  }
  function clearType() {
    setType('');
  }
  return (
    <>
      <Card>
        <CardContent>
          <FormControl component="fieldset" className={classes.commentType}>
            <RadioGroup
              aria-labelledby="comment-type-choice"
              className={classes.commentTypeGroup}
              onChange={onTypeChange}
              value={type}
              row
            >
              {allowedTypes.map((commentType) => {
                return (
                  <Tooltip key={`tip${commentType}`}
                           title={<FormattedMessage id={`${commentType.toLowerCase()}Tip`} />}>
                    <FormControlLabel
                      key={commentType}
                      className={clsx(
                        commentType === ISSUE_TYPE
                          ? `${classes.chipItem} ${classes.chipItemIssue}`
                          : commentType === QUESTION_TYPE ? `${classes.chipItem} ${classes.chipItemQuestion}`
                          : commentType === SUGGEST_CHANGE_TYPE ? `${classes.chipItem} ${classes.chipItemSuggestion}`
                            : commentType === TODO_TYPE ? `${classes.chipItem} ${classes.chipItemTodo}`
                              : `${classes.chipItem} ${classes.chipItemReport}`,
                        type === commentType || type === '' ? classes.selected : classes.unselected
                      )
                      }
                      /* prevent clicking the label stealing focus */
                      onMouseDown={e => e.preventDefault()}
                      control={<Radio color="primary" />}
                      label={<FormattedMessage id={`${commentType.toLowerCase()}Present`} />}
                      labelPlacement="end"
                      value={commentType}
                    />
                  </Tooltip>
                );
              })}
            </RadioGroup>
          </FormControl>
        </CardContent>
      </Card>
      <div className={classes.addBox}>
        <CommentAdd
          key="CommentAdd"
          type={type}
          clearType={clearType}
          investible={investible}
          marketId={marketId}
          issueWarningId={issueWarningId}
          onSave={onSave}
        />
      </div>
    </>
  );
}

CommentAddBox.propTypes = {
  marketId: PropTypes.string.isRequired,
  issueWarningId: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  investible: PropTypes.any,
  allowedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSave: PropTypes.func,
};

CommentAddBox.defaultProps = {
  investible: undefined,
  onSave: () => {},
  issueWarningId: null,
};

export default CommentAddBox;
