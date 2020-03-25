import React, { useState } from 'react'
import PropTypes from 'prop-types';
import { Card, CardContent, FormControl, FormControlLabel, makeStyles, Radio, RadioGroup } from '@material-ui/core'
import CommentAdd from '../../components/Comments/CommentAdd';
import { FormattedMessage } from 'react-intl';
import { ISSUE_TYPE, QUESTION_TYPE } from '../../constants/comments';

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
    '& .MuiChip-label': {
      fontSize: 12,
    },
    '& .MuiChip-avatar': {
      width: '16px',
      height: '14px',
      color: '#fff',
    },
    borderRadius: 16,
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    margin: theme.spacing(0, 0, 0, 8)
  },
  chipItemQuestion: {
    background: '#2F80ED',
  },
  chipItemIssue: {
    background: '#E85757',
  },
  chipItemSuggestion: {
    background: '#F29100',
  },
  chipItemFor: {
    background: '#73B76C',
  },
  chipItemAgainst: {
    background: '#D54F22',
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
  const [type, setType] = useState(ISSUE_TYPE);
  const classes = useStyles();

  function onTypeChange(event) {
    const { value } = event.target;
    setType(value);
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
                  <FormControlLabel
                    key={commentType}
                    className={
                      commentType === ISSUE_TYPE
                        ? `${classes.chipItem} ${classes.chipItemIssue}`
                        : commentType === QUESTION_TYPE ? `${classes.chipItem} ${classes.chipItemQuestion}`
                        : `${classes.chipItem} ${classes.chipItemSuggestion}`
                    }
                    /* prevent clicking the label stealing focus */
                    onMouseDown={e => e.preventDefault()}
                    control={<Radio color="primary" />}
                    label={<FormattedMessage id={`${commentType.toLowerCase()}Present`} />}
                    labelPlacement="end"
                    value={commentType}
                  />
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
