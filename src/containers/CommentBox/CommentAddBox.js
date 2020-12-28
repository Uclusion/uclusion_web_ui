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
import EmojiObjectsIcon from '@material-ui/icons/EmojiObjects'
import DescriptionIcon from '@material-ui/icons/Description'
import AssignmentIcon from '@material-ui/icons/Assignment'
import HelpIcon from '@material-ui/icons/Help'
import BlockIcon from '@material-ui/icons/Block'

import clsx from 'clsx'
import CommentAdd from '../../components/Comments/CommentAdd'
import { FormattedMessage } from 'react-intl'
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../constants/comments'

export const useStyles = makeStyles((theme) => ({
  hidden: {
    display: 'none',
  },
  addBox: {},
  commentType: {
    [theme.breakpoints.down('sm')]: {
      display: 'block',
      marginLeft: 'auto',
      marginRight: 'auto'
    }
  },
  commentTypeGroup: {
    display: "flex",
    flexDirection: "row",
    [theme.breakpoints.down('sm')]: {
      display: 'block'
    }
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
      textTransform: 'capitalize',
      [theme.breakpoints.down('sm')]: {
        height: '100%',
        verticalAlign: 'middle',
        display: 'inline-block',
        '& .MuiSvgIcon-root': {
          display: 'block'
        }
      },
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
    margin: theme.spacing(0, 0, 0, 4),
    [theme.breakpoints.down('sm')]: {
      margin: '10px'
    },
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
  commentTypeContainer: {
    borderRadius: '4px 4px 0 0'
  }
}));

export function getIcon(commentType) {

  switch (commentType) {
    case SUGGEST_CHANGE_TYPE: {
      return <EmojiObjectsIcon />;
    }
    case ISSUE_TYPE: {
      return <BlockIcon />;
    }
    case QUESTION_TYPE: {
      return <HelpIcon />;
    }
    case TODO_TYPE: {
      return <AssignmentIcon />;
    }
    case 'REPORT': {
      return <DescriptionIcon />;
    }
    default: {
      return null;
    }
  }
}

function CommentAddBox(props) {
  const {
    marketId,
    investible,
    allowedTypes,
    onSave,
    issueWarningId,
    todoWarningId,
    isPlanning,
    isStory,
    hidden
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
  function getMessageId(aCommentType) {
    if (!isPlanning || aCommentType !== ISSUE_TYPE) {
      return `${aCommentType.toLowerCase()}Present`;
    }
    return "nonBlockIssuePresent";
  }
  return (
    <>
      <Card elevation={0} className={type === TODO_TYPE && !investible ? classes.hidden : classes.commentTypeContainer}>
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
                      id={`commentAddLabel${commentType}`}
                      key={commentType}
                      className={clsx(
                        commentType === ISSUE_TYPE
                          ? `${classes.chipItem} ${classes.chipItemIssue}`
                          : commentType === QUESTION_TYPE ? `${classes.chipItem} ${classes.chipItemQuestion}`
                          : commentType === SUGGEST_CHANGE_TYPE ? `${classes.chipItem} ${classes.chipItemSuggestion}`
                            : commentType === TODO_TYPE ? `${classes.chipItem} ${classes.chipItemTodo}`
                              : `${classes.chipItem} ${classes.chipItemReport}`,
                        type === commentType ? classes.selected : classes.unselected
                      )
                      }
                      /* prevent clicking the label stealing focus */
                      onMouseDown={e => e.preventDefault()}
                      control={<Radio color="primary" />}
                      label={window.outerWidth < 600 ? getIcon(commentType) : <FormattedMessage id={getMessageId(commentType)} />}
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
          todoWarningId={todoWarningId}
          isStory={isStory}
          hidden={hidden}
        />
      </div>
    </>
  );
}

CommentAddBox.propTypes = {
  marketId: PropTypes.string.isRequired,
  issueWarningId: PropTypes.string,
  todoWarningId: PropTypes.string,
  // eslint-disable-next-line react/forbid-prop-types
  investible: PropTypes.any,
  allowedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  onSave: PropTypes.func,
  isPlanning: PropTypes.bool,
  isStory: PropTypes.bool,
  hidden: PropTypes.bool
};

CommentAddBox.defaultProps = {
  investible: undefined,
  onSave: () => {},
  issueWarningId: null,
  todoWarningId: null,
  isPlanning: false,
  isStory: false,
  hidden: false
};

export default CommentAddBox;
