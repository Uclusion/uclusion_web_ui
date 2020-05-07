import React, { useContext, useEffect, useState } from 'react'
import { FormattedMessage, injectIntl } from 'react-intl'
import classNames from 'clsx'
import clsx from 'clsx'
import _ from 'lodash'
import { Button, darken, makeStyles, Paper } from '@material-ui/core'
import PropTypes from 'prop-types'
import QuillEditor from '../TextEditors/QuillEditor'
import { saveComment } from '../../api/comments'
import {
  ISSUE_TYPE,
  QUESTION_TYPE,
  REPLY_TYPE,
  REPORT_TYPE,
  SUGGEST_CHANGE_TYPE,
  TODO_TYPE,
} from '../../constants/comments'
import { processTextAndFilesForSave } from '../../api/files'
import SpinBlockingButton from '../SpinBlocking/SpinBlockingButton'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { addCommentToMarket } from '../../contexts/CommentsContext/commentsContextHelper'
import { Dialog } from '../Dialogs'
import WarningIcon from '@material-ui/icons/Warning'
import { useLockedDialogStyles } from '../../pages/Dialog/DialogEdit'
import { EMPTY_SPIN_RESULT } from '../../constants/global'
import { VersionsContext } from '../../contexts/VersionsContext/VersionsContext'

function getPlaceHolderLabelId (type) {
  switch (type) {
    case QUESTION_TYPE:
      return 'commentAddQuestionDefault';
    case SUGGEST_CHANGE_TYPE:
      return 'commentAddSuggestDefault';
    case ISSUE_TYPE:
      return 'commentAddIssueDefault';
    case REPLY_TYPE:
      return 'commentAddReplyDefault';
    case REPORT_TYPE:
      return 'commentAddReportDefault';
    case TODO_TYPE:
      return 'commentAddTODODefault';
    default:
      throw new Error(`Unknown comment type:${type}`);
  }
}

const useStyles = makeStyles((theme) => ({
  modal: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paper: {
    position: 'absolute',
    width: 400,
    backgroundColor: theme.palette.background.paper,
    border: '2px solid #000',
    boxShadow: theme.shadows[5],
    padding: theme.spacing(2, 4, 3),
  },
  hidden: {
    display: 'none',
  },
  add: {
    display: 'flex',
    marginBottom: 16,
  },
  editor: {
    flex: 1,
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
    '&:hover': {
      backgroundColor: darken('#2d9cdb', 0.08)
    },
    '&:focus': {
      backgroundColor: darken('#2d9cdb', 0.24)
    },
  },
}), { name: 'CommentAdd' });

function CommentAdd (props) {
  const {
    intl, marketId, onSave, onCancel, type, investible, parent, hidden, issueWarningId,
  } = props;
  const [body, setBody] = useState('');
  const [commentsState, commentDispatch] = useContext(CommentsContext);
  const [, versionsDispatch] = useContext(VersionsContext);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [openIssue, setOpenIssue] = useState(false);
  const classes = useStyles();
  const placeHolderLabelId = getPlaceHolderLabelId(type);
  const placeHolder = intl.formatMessage({ id: placeHolderLabelId });
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [firstOpen, setFirstOpen] = useState(true);
  const [placeHolderType, setPlaceHolderType] = useState(type);
  const defaultClearFunc = (newPlaceHolder) => {};
  //see https://stackoverflow.com/questions/55621212/is-it-possible-to-react-usestate-in-react for why we have a func
  // that returns  func for editorClearFunc
  const [editorClearFunc, setEditorClearFunc] = useState(() => defaultClearFunc);
  const defaultFocusFunc = () => {};
  const [editorFocusFunc, setEditorFocusFunc] = useState(() => defaultFocusFunc);

  useEffect(() => {
    if (!hidden && firstOpen) {
      editorFocusFunc();
      setFirstOpen(false);
    }
    if (hidden && !firstOpen) {
      setFirstOpen(true);
    }
    if (_.isEmpty(body) && type !== placeHolderType) {
      setPlaceHolderType(type);
      editorClearFunc(placeHolder);
    }
    return () => {};
  }, [hidden, firstOpen, editorFocusFunc, body, type, placeHolderType, placeHolder, editorClearFunc]);

  function onEditorChange (content) {
    setBody(content);
  }

  function toggleIssue () {
    setOpenIssue(!openIssue);
  }

  function onS3Upload (metadatas) {
    setUploadedFiles(metadatas);
  }

  function handleSave () {
    const usedParent = parent || {};
    const { investible_id: parentInvestible, id: parentId } = usedParent;
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, body);
    // the API does _not_ want you to send reply type, so suppress if our type is reply
    const apiType = (type === REPLY_TYPE) ? undefined : type;
    const investibleId = (investible) ? investible.id : parentInvestible;
    return saveComment(marketId, investibleId, parentId, tokensRemoved, apiType, filteredUploads)
      .then((comment) => {
        addCommentToMarket(comment, commentsState, commentDispatch, versionsDispatch);
        return EMPTY_SPIN_RESULT;
      });
  }

  function handleCancel () {
    setBody('');
    editorClearFunc();
    setUploadedFiles([]);
    setOpenIssue(false);
    onCancel();
  }

  function handleSpinStop () {
    setBody('');
    editorClearFunc();
    setUploadedFiles([]);
    setOpenIssue(false);
    onSave();
  }

  const commentSaveLabel = parent ? 'commentAddSaveLabel' : 'commentReplySaveLabel';
  const commentCancelLabel = parent ? 'commentReplyCancelLabel' : 'commentAddCancelLabel';
  const showIssueWarning = (issueWarningId !== null && type === ISSUE_TYPE) || type === TODO_TYPE;
  const myWarningId = type === TODO_TYPE ? 'todoWarningPlanning' : issueWarningId;
  const lockedDialogClasses = useLockedDialogStyles();
  return (
    <Paper
      id={hidden ? '' : 'cabox'}
      className={(hidden) ? classes.hidden : classes.add}
      elevation={2}
    >
      <div className={classes.editor}>
        <QuillEditor
          marketId={marketId}
          placeholder={placeHolder}
          defaultValue={body}
          onChange={onEditorChange}
          onS3Upload={onS3Upload}
          setOperationInProgress={setOperationRunning}
          setEditorClearFunc={(func) => {
            setEditorClearFunc(func);
          }}
          setEditorFocusFunc={(func) => {
            // console.log('Setting focus func');
            setEditorFocusFunc(func);
          }}
        >
          <Button
            onClick={handleCancel}
            className={classes.button}
          >
            {intl.formatMessage({ id: commentCancelLabel })}
          </Button>
          {!showIssueWarning && (
            <SpinBlockingButton
              className={classNames(classes.button, classes.buttonPrimary)}
              marketId={marketId}
              onClick={handleSave}
              onSpinStop={handleSpinStop}
              disabled={_.isEmpty(body)}
              hasSpinChecker
            >
              {intl.formatMessage({ id: commentSaveLabel })}
            </SpinBlockingButton>
          )}
          {showIssueWarning && (
            <Button className={classNames(classes.button, classes.buttonPrimary)} onClick={toggleIssue}>
              {intl.formatMessage({ id: commentSaveLabel })}
            </Button>
          )}
          {myWarningId && (
            <IssueDialog
              classes={lockedDialogClasses}
              open={!hidden && openIssue}
              onClose={toggleIssue}
              issueWarningId={myWarningId}
              /* slots */
              actions={
                <SpinBlockingButton
                  className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionEdit)}
                  disableFocusRipple
                  marketId={marketId}
                  onClick={handleSave}
                  onSpinStop={handleSpinStop}
                  disabled={_.isEmpty(body)}
                  hasSpinChecker
                >
                  <FormattedMessage id="issueProceed" />
                </SpinBlockingButton>
              }
            />
          )}
        </QuillEditor>
      </div>
    </Paper>
  );
}

function IssueDialog(props) {
  const { actions, classes, open, onClose, issueWarningId } = props;

  const autoFocusRef = React.useRef(null);

  return (
    <Dialog
      autoFocusRef={autoFocusRef}
      classes={{
        root: classes.root,
        actions: classes.actions,
        content: classes.issueWarningContent,
        title: classes.title
      }}
      open={open}
      onClose={onClose}
      /* slots */
      actions={
        <React.Fragment>
          {actions}
          <Button
            className={clsx(classes.action, classes.actionCancel)}
            disableFocusRipple
            onClick={onClose}
            ref={autoFocusRef}
          >
            <FormattedMessage id="lockDialogCancel" />
          </Button>
        </React.Fragment>
      }
      content={<FormattedMessage id={issueWarningId} />}
      title={
        <React.Fragment>
          <WarningIcon className={classes.warningTitleIcon} />
          <FormattedMessage id="warning" />
        </React.Fragment>
      }
    />
  );
}

IssueDialog.propTypes = {
  actions: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  issueWarningId: PropTypes.string.isRequired,
};

CommentAdd.propTypes = {
  type: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  issueWarningId: PropTypes.string,
  onSave: PropTypes.func.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investible: PropTypes.object,
  // eslint-disable-next-line react/forbid-prop-types
  parent: PropTypes.object,
  onCancel: PropTypes.func,
  hidden: PropTypes.bool,
};

CommentAdd.defaultProps = {
  parent: null,
  investible: null,
  onCancel: () => {},
  hidden: false,
};

export default injectIntl(CommentAdd);
