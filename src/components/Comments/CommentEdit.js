import React, { useContext } from 'react'
import { useIntl } from 'react-intl'
import {
  Card,
  CardActions,
  CardContent,
  darken,
  makeStyles,
  Typography, useMediaQuery, useTheme
} from '@material-ui/core';
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
import { onCommentOpen } from '../../utils/commentFunctions'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { findMessageOfType } from '../../utils/messageUtils'
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext'
import { Clear, Feedback, Update } from '@material-ui/icons';
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton'
import {  useEditor } from '../TextEditors/quillHooks'
import { deleteOrDehilightMessages } from '../../api/users'
import { workListStyles } from '../../pages/Home/YourWork/WorkListItem'
import { getQuillStoredState } from '../TextEditors/Utilities/CoreUtils'
import { nameFromDescription } from '../../utils/stringFunctions';
import { addInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { removeMessages } from '../../contexts/NotificationsContext/notificationsContextReducer';
import EmojiObjectsIcon from '@material-ui/icons/EmojiObjects';
import BlockIcon from '@material-ui/icons/Block';
import HelpIcon from '@material-ui/icons/Help';
import AssignmentIcon from '@material-ui/icons/Assignment';

const useStyles = makeStyles((theme) => ({
  visible: {
    overflow: 'visible'
  },
  cardContent: {
    padding: 0,
    paddingTop: '1rem'
  },
  cardActions: {
    padding: 8,
  },
  storageIndicator: {
    display: 'inline-block',
    fontSize: '10px',
    fontWeight: 'bold',
  },
  button: {
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: 8,
    textTransform: 'none',
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
      return <Feedback />;
    }
    default: {
      return null;
    }
  }
}

function CommentEdit(props) {
  const {
    marketId, onSave, onCancel, comment, myNotificationType, editState, updateEditState, editStateReset, messages
  } = props;
  const {
    uploadedFiles,
    notificationType
  } = editState;
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const workItemClasses = workListStyles();
  const { id, uploaded_files: initialUploadedFiles, comment_type: commentType, investible_id: investibleId,
    body: initialBody, creator_assigned: creatorAssigned } = comment;
  const classes = useStyles();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [investibleState, investibleDispatch] = useContext(InvestiblesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(marketPresencesState, marketId);
  const [marketStagesState] = useContext(MarketStagesContext);

  const editorName = `comment-edit-editor${id}`;
  const editorSpec = {
    value: getQuillStoredState(editorName) || initialBody,
    onUpload: (files) => updateEditState({uploadedFiles: files}),
    participants: presences,
    marketId,
  }
  const [Editor, resetEditor] = useEditor(editorName, editorSpec);

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
    const myActualNotificationType = commentType === TODO_TYPE && !investibleId ? myNotificationType :
      (commentType === REPORT_TYPE ? notificationType : undefined);
    let label = undefined;
    if (creatorAssigned && commentType === REPORT_TYPE) {
      label = nameFromDescription(tokensRemoved);
    }
    return updateComment(marketId, id, tokensRemoved, undefined, filteredUploads, mentions,
      myActualNotificationType, undefined, label)
      .then((response) => {
        let comment = response;
        if (!_.isEmpty(label)) {
          const { comment: returnedComment, investible: returnedInvestible } = response;
          comment = returnedComment;
          addInvestible(investibleDispatch, () => {}, returnedInvestible);
        }
        resetEditor();
        onCommentOpen(investibleState, investibleId, marketStagesState, marketId, comment, investibleDispatch,
          commentState, commentDispatch);
        deleteOrDehilightMessages(messages || [], messagesDispatch, workItemClasses.removed, true,
          true);
        if (commentType === REPORT_TYPE) {
          const message = findMessageOfType('REPORT_REQUIRED', investibleId, messagesState);
          if (message) {
            messagesDispatch(removeMessages([message.type_object_id]));
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
    resetEditor();
    editStateReset();
    onCancel();
  }

  return (
    <Card elevation={0} className={classes.visible} >
      <CardContent className={classes.cardContent}>
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
          <Typography className={classes.storageIndicator}>
            {intl.formatMessage({ id: 'edited' })}
          </Typography>
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
  onSave: () => {},
};

export default CommentEdit;
