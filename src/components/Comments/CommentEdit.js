import React, { useContext, useRef, useState } from 'react';
import { useIntl } from 'react-intl';
import {
  Card,
  CardActions,
  CardContent,
  darken,
  makeStyles,
  Typography,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { getMentionsFromText, updateComment } from '../../api/comments';
import { processTextAndFilesForSave } from '../../api/files';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { ISSUE_TYPE, QUESTION_TYPE, REPORT_TYPE, SUGGEST_CHANGE_TYPE, TODO_TYPE } from '../../constants/comments';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import _ from 'lodash';
import { onCommentOpen } from '../../utils/commentFunctions';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { findMessageOfType } from '../../utils/messageUtils';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { Clear, Feedback, Update } from '@material-ui/icons';
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton';
import { useEditor } from '../TextEditors/quillHooks';
import { deleteOrDehilightMessages } from '../../api/users';
import { getQuillStoredState, resetEditor } from '../TextEditors/Utilities/CoreUtils';
import { nameFromDescription } from '../../utils/stringFunctions';
import { addInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { removeMessages } from '../../contexts/NotificationsContext/notificationsContextReducer';
import EmojiObjectsIcon from '@material-ui/icons/EmojiObjects';
import BlockIcon from '@material-ui/icons/Block';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { allImagesLoaded } from '../../utils/windowUtils';
import { sendInfoPersistent } from '../../utils/userMessage';
import WizardStepContainer from '../AddNewWizards/WizardStepContainer';
import WizardStepButtons from '../AddNewWizards/WizardStepButtons';
import { WizardStylesContext } from '../AddNewWizards/WizardStylesContext';
import QuestionIcon from '@material-ui/icons/ContactSupport';

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
      return <QuestionIcon />;
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
    marketId, onSave, onCancel, comment, myNotificationType, editState, updateEditState, editStateReset, isWizard,
    messages
  } = props;
  const {
    uploadedFiles,
    notificationType
  } = editState;
  const intl = useIntl();
  const theme = useTheme();
  const editBox = useRef(null);
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const { id, uploaded_files: initialUploadedFiles, comment_type: commentType, investible_id: investibleId,
    body: initialBody } = comment;
  const classes = useStyles();
  const wizardClasses = useContext(WizardStylesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
  const [investibleState, investibleDispatch] = useContext(InvestiblesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = presences?.find((presence) => presence.current_user) || {};
  const [marketStagesState] = useContext(MarketStagesContext);
  const [imagesDeleted, setImagesDeleted] = useState(false);

  const editorName = `comment-edit-editor${id}`;
  const editorSpec = {
    onImageDeletion: () => {
      setImagesDeleted(true);
    },
    value: getQuillStoredState(editorName) || initialBody,
    onUpload: (files) => updateEditState({uploadedFiles: files}),
    participants: presences.filter((presence) => !presence.market_banned),
    marketId,
  }
  const [Editor] = useEditor(editorName, editorSpec);

  function handleSave(isSent) {
    const imagesLoaded = allImagesLoaded(editBox?.current, initialUploadedFiles);
    if (!imagesLoaded && !imagesDeleted) {
      sendInfoPersistent({ id: 'loadImageError' }, {},
        () =>  window.location.reload(true));
      return Promise.resolve(false);
    }
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
    if (commentType === REPORT_TYPE) {
      label = nameFromDescription(tokensRemoved);
    }
    return updateComment({marketId, commentId: id, body: tokensRemoved, uploadedFiles: filteredUploads, mentions,
      notificationType: myActualNotificationType, investibleLabel: label, isSent})
      .then((response) => {
        let comment = response;
        if (!_.isEmpty(label)) {
          const { comment: returnedComment, investible: returnedInvestible } = response;
          comment = returnedComment;
          addInvestible(investibleDispatch, () => {}, returnedInvestible);
        }
        resetEditor(editorName);
        onCommentOpen(investibleState, investibleId, marketStagesState, marketId, comment, investibleDispatch,
          commentState, commentDispatch, myPresence);
        deleteOrDehilightMessages(messages || [], messagesDispatch, true, true);
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
    resetEditor(editorName);
    editStateReset();
    onCancel();
  }

  if (isWizard) {
    return (
      <WizardStepContainer
        {...props}
        isLarge
      >
        <Typography className={wizardClasses.introText}>
          What is your question?
        </Typography>
        <Typography className={wizardClasses.introSubText} variant="subtitle1">
          Pick up where you left off asking this question.
        </Typography>
        {Editor}
        <div className={wizardClasses.borderBottom} />
        <WizardStepButtons
          {...props}
          nextLabel="JobCommentAddQUESTION"
          isFinal={false}
          onNext={() => {
              if (getQuillStoredState(editorName) !== initialBody) {
                handleSave(false);
              }
            }
          }
          onTerminate={() => handleSave(true)}
          showTerminate
          terminateLabel="commentAddSendLabel"/>
      </WizardStepContainer>
    );
  }

  return (
    <Card elevation={0} className={classes.visible} ref={editBox}>
      <CardContent className={classes.cardContent}>
        {Editor}
      </CardContent>
      <CardActions className={classes.cardActions}>
        <SpinningIconLabelButton onClick={handleCancel} doSpin={false} icon={Clear}>
          {intl.formatMessage({ id: 'cancel' })}
        </SpinningIconLabelButton>
        <SpinningIconLabelButton
          icon={Update}
          onClick={() => handleSave(true)}
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
  isWizard: PropTypes.bool
};

CommentEdit.defaultProps = {
  allowedTypes: [],
  onSave: () => {},
  isWizard: false
};

export default CommentEdit;
