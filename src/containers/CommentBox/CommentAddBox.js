import React from 'react'
import PropTypes from 'prop-types'
import {
  Card,
  FormControl,
  FormControlLabel,
  makeStyles,
  Radio,
  RadioGroup,
  Tooltip, useMediaQuery, useTheme
} from '@material-ui/core'
import EmojiObjectsIcon from '@material-ui/icons/EmojiObjects'
import DescriptionIcon from '@material-ui/icons/Description'
import AssignmentIcon from '@material-ui/icons/Assignment'
import HelpIcon from '@material-ui/icons/Help'
import BlockIcon from '@material-ui/icons/Block'

import clsx from 'clsx'
import CommentAdd from '../../components/Comments/CommentAdd'
import { FormattedMessage } from 'react-intl'
import { ISSUE_TYPE, QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../constants/comments'
import { getPageReducerPage, usePageStateReducer } from '../../components/PageState/pageStateHooks'
import _ from 'lodash'

export const useStyles = makeStyles((theme) => ({
  hidden: {
    display: 'none',
  },
  addBox: {
    paddingTop: '1rem',
    paddingBottom: '0.1rem'
  },
  commentType: {
    paddingTop: '1rem',
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
  chipItemBlack: {
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
        color: 'black'
      }
    },
    paddingRight: theme.spacing(1),
    paddingLeft: theme.spacing(1),
    margin: theme.spacing(0, 0, 0, 4),
    [theme.breakpoints.down('sm')]: {
      margin: '10px'
    },
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
  commentTypeContainer: {}
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
    case REPORT_TYPE: {
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
    issueWarningId,
    todoWarningId,
    isStory,
    isInReview,
    isAssignee,
    numProgressReport
  } = props;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [commentAddStateFull, commentAddDispatch] = usePageStateReducer('commentAdd');
  const [commentAddState, updateCommentAddState, commentAddStateReset] =
    getPageReducerPage(commentAddStateFull, commentAddDispatch, investible ? investible.id : marketId);
  const {
    type,
  } = commentAddState;
  const useType = type || _.size(allowedTypes) === 1 ? allowedTypes[0] : undefined;
  const classes = useStyles();
  function onTypeChange(event) {
    const { value } = event.target;
    updateCommentAddState({type: value});
  }

  function getMessageId(aCommentType) {
    if (!isInReview || aCommentType !== REPORT_TYPE || isAssignee) {
      return `${aCommentType.toLowerCase()}Present`;
    }
    return "reviewReportPresent";
  }
  return (
    <Card id="commentAddBox" style={{marginBottom: '2rem', overflow: 'unset'}} elevation={3}>
      <FormControl component="fieldset" className={useType === TODO_TYPE && !investible ? classes.hidden :
        classes.commentType}>
        <RadioGroup
          aria-labelledby="comment-type-choice"
          className={classes.commentTypeGroup}
          onChange={onTypeChange}
          value={useType || ''}
          row
        >
          {allowedTypes.map((commentType) => {
            return (
              <Tooltip key={`tip${commentType}`}
                       title={<FormattedMessage id={isInReview && commentType === REPORT_TYPE ? 'reportReviewTip' :
                         `${commentType.toLowerCase()}Tip`} />}>
                <FormControlLabel
                  id={`commentAddLabel${commentType}`}
                  key={commentType}
                  className={clsx(
                    commentType === ISSUE_TYPE
                      ? `${classes.chipItem} ${classes.chipItemIssue}`
                      : commentType === QUESTION_TYPE ? `${classes.chipItem} ${classes.chipItemQuestion}`
                      : commentType === SUGGEST_CHANGE_TYPE ? `${classes.chipItemBlack} ${classes.chipItemSuggestion}`
                        : commentType === TODO_TYPE ? `${classes.chipItem} ${classes.chipItemTodo}`
                          : `${classes.chipItem} ${classes.chipItemReport}`,
                    useType === commentType ? classes.selected : classes.unselected
                  )
                  }
                  /* prevent clicking the label stealing focus */
                  onMouseDown={e => e.preventDefault()}
                  control={<Radio color="primary" />}
                  label={mobileLayout ? getIcon(commentType) : <FormattedMessage id={getMessageId(commentType)} />}
                  labelPlacement="end"
                  value={commentType}
                />
              </Tooltip>
            );
          })}
        </RadioGroup>
      </FormControl>
      <div className={classes.addBox}>
        <CommentAdd
          type={useType}
          commentAddState={commentAddState}
          updateCommentAddState={updateCommentAddState}
          commentAddStateReset={commentAddStateReset}
          onCancel={() => commentAddStateReset()}
          investible={investible}
          marketId={marketId}
          issueWarningId={issueWarningId}
          todoWarningId={todoWarningId}
          isStory={isStory}
          autoFocus={false}
          numProgressReport={numProgressReport}
        />
      </div>
    </Card>
  );
}

CommentAddBox.propTypes = {
  marketId: PropTypes.string.isRequired,
  issueWarningId: PropTypes.string,
  todoWarningId: PropTypes.string,
  investible: PropTypes.any,
  allowedTypes: PropTypes.arrayOf(PropTypes.string).isRequired,
  isStory: PropTypes.bool
};

CommentAddBox.defaultProps = {
  investible: undefined,
  issueWarningId: null,
  todoWarningId: null,
  isStory: false
};

export default CommentAddBox;
