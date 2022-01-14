import React, { useContext, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  darken,
  FormControl,
  FormControlLabel,
  makeStyles,
  Radio,
  RadioGroup, useMediaQuery, useTheme
} from '@material-ui/core'
import PropTypes from 'prop-types'
import { getMentionsFromText, updateComment } from '../../api/comments';
import { processTextAndFilesForSave } from '../../api/files'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { ISSUE_TYPE, QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../constants/comments'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import _ from 'lodash';
import clsx from 'clsx'
import { getIcon } from '../../containers/CommentBox/CommentAddBox'
import { onCommentOpen } from '../../utils/commentFunctions'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { findMessageOfType } from '../../utils/messageUtils'
import { removeMessage } from '../../contexts/NotificationsContext/notificationsContextReducer'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { Clear, Update } from '@material-ui/icons'
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton'
import { editorReset, useEditor } from '../TextEditors/quillHooks'
import { getQuillStoredState } from '../TextEditors/QuillEditor2'
import { deleteOrDehilightMessages } from '../../api/users'
import { workListStyles } from '../../pages/Home/YourWork/WorkListItem'

const useStyles = makeStyles((theme) => ({
  visible: {
    overflow: 'visible'
  },
  cardContent: {
    padding: 0,
  },
  cardActions: {
    padding: 8,
  },
  button: {
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: 8,
    textTransform: 'capitalize',
  },
  buttonPrimary: {
    backgroundColor: '#2d9cdb',
    color: '#fff',
    "&:hover": {
      backgroundColor: darken('#2d9cdb', 0.08)
    },
    "&:focus": {
      backgroundColor: darken('#2d9cdb', 0.24)
    },
  },
  todoLabelType: {
    alignSelf: "start",
    display: "inline-flex"
  },
  commentType: {
    [theme.breakpoints.down('sm')]: {
      display: 'block',
      marginLeft: 'auto',
      marginRight: 'auto'
    },
    paddingBottom: '15px'
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
}), { name: 'CommentEdit' });

function CommentEdit(props) {
  const {
    marketId, onSave, onCancel, comment, allowedTypes, myNotificationType, isInReview, editState, updateEditState,
    editStateReset, messages
  } = props;
  const {
    uploadedFiles,
    notificationType
  } = editState;
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const workItemClasses = workListStyles();
  const { id, uploaded_files: initialUploadedFiles, comment_type: commentType, inline_market_id: inlineMarketId,
    investible_id: investibleId, body: initialBody } = comment;
  const classes = useStyles();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [type, setType] = useState(commentType);
  const [investibleState, investibleDispatch] = useContext(InvestiblesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(marketPresencesState, marketId);
  const [marketStagesState] = useContext(MarketStagesContext);

  const editorName = `${id}-comment-edit-editor`;
  const editorSpec = {
    value: getQuillStoredState(editorName) || initialBody,
    onUpload: (files) => updateEditState({uploadedFiles: files}),
    participants: presences,
    marketId,
  }
  const [Editor, editorController] = useEditor(editorName, editorSpec);

  function handleSave() {
    const currentUploadedFiles = uploadedFiles || [];
    const existingUploadedFiles = initialUploadedFiles || [];
    const newUploadedFiles = _.uniqBy([...existingUploadedFiles, ...currentUploadedFiles], 'path');
    const body = getQuillStoredState(editorName) !== null ? getQuillStoredState(editorName) : initialBody;
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, body);
    const mentions = getMentionsFromText(tokensRemoved);
    const updatedType = type !== commentType ? type : undefined;
    const myActualNotificationType = commentType === TODO_TYPE && !investibleId ? myNotificationType :
      (commentType === REPORT_TYPE ? notificationType : undefined);
    return updateComment(marketId, id, tokensRemoved, updatedType, filteredUploads, mentions, myActualNotificationType)
      .then((comment) => {
        editorController(editorReset());
        onCommentOpen(investibleState, investibleId, marketStagesState, marketId, comment, investibleDispatch,
          commentState, commentDispatch);
        deleteOrDehilightMessages(messages || [], messagesDispatch, workItemClasses.removed, false);
        if (commentType === REPORT_TYPE) {
          const message = findMessageOfType('REPORT_REQUIRED', investibleId, messagesState);
          if (message) {
            messagesDispatch(removeMessage(message));
          }
        }
        setOperationRunning(false);
        handleSpinStop();
      })
  }

  function handleSpinStop() {
    editStateReset();
    onSave();
  }

  function handleCancel() {
    editorController(editorReset(initialBody));
    editStateReset();
    onCancel();
  }

  function onTypeChange(event) {
    const { value } = event.target;
    setType(value);
  }

  return (
    <Card elevation={0} className={classes.visible} >
      <CardContent className={classes.cardContent}>
        {allowedTypes.length > 1 && !inlineMarketId && (
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
                    className={clsx(
                      commentType === ISSUE_TYPE
                        ? `${classes.chipItem} ${classes.chipItemIssue}`
                        : commentType === QUESTION_TYPE ? `${classes.chipItem} ${classes.chipItemQuestion}`
                        : commentType === SUGGEST_CHANGE_TYPE ? `${classes.chipItem} ${classes.chipItemSuggestion}`
                          : commentType === TODO_TYPE ? `${classes.chipItem} ${classes.chipItemTodo}`
                            : `${classes.chipItem} ${classes.chipItemReport}`,
                      type === commentType ? classes.selected : classes.unselected
                    )}
                    /* prevent clicking the label stealing focus */
                    onMouseDown={e => e.preventDefault()}
                    control={<Radio color="primary" />}
                    label={mobileLayout ? getIcon(commentType) :
                      <FormattedMessage id={isInReview && commentType === REPORT_TYPE ? 'reviewReportPresent'
                        : `${commentType.toLowerCase()}Present`} />}
                    labelPlacement="end"
                    value={commentType}
                  />
                );
              })}
            </RadioGroup>
          </FormControl>
        )}
        {Editor}
      </CardContent>
      <CardActions className={classes.cardActions}>
        <SpinningIconLabelButton onClick={handleCancel} doSpin={false} icon={Clear}>
          {intl.formatMessage({ id: 'cancel' })}
        </SpinningIconLabelButton>
        <SpinningIconLabelButton
          icon={Update}
          onClick={handleSave}
          id="updateCommentButton"
        >
          {intl.formatMessage({ id: 'update' })}
        </SpinningIconLabelButton>
        {!mobileLayout && (
          <Button className={classes.button}>
            {intl.formatMessage({ id: 'edited' })}
          </Button>
        )}
      </CardActions>
    </Card>
  );
}

CommentEdit.propTypes = {
  allowedTypes: PropTypes.arrayOf(PropTypes.string),
  marketId: PropTypes.string.isRequired,
  onSave: PropTypes.func,
  comment: PropTypes.object.isRequired,
  onCancel: PropTypes.func,
};

CommentEdit.defaultProps = {
  allowedTypes: [],
  onCancel: () => {},
  onSave: () => {},
};

export default CommentEdit;
