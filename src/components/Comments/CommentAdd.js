import React, { useState, useContext } from 'react';
import { injectIntl } from 'react-intl';
import classNames from 'clsx';
import _ from 'lodash';
import {
  Button, makeStyles, Paper, darken
} from '@material-ui/core';
import Modal from '@material-ui/core/Modal';
import PropTypes from 'prop-types';
import QuillEditor from '../TextEditors/QuillEditor';
import { saveComment } from '../../api/comments';
import {
  QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE, REPLY_TYPE,
} from '../../constants/comments';
import { processTextAndFilesForSave } from '../../api/files';
import SpinBlockingButton from '../SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext';
import { checkIfCommentInStorage } from '../../contexts/CommentsContext/commentsContextHelper';

function getPlaceHolderLabelId(type) {
  switch (type) {
    case QUESTION_TYPE:
      return 'commentAddQuestionDefault';
    case SUGGEST_CHANGE_TYPE:
      return 'commentAddSuggestDefault';
    case ISSUE_TYPE:
      return 'commentAddIssueDefault';
    case REPLY_TYPE:
      return 'commentAddReplyDefault';
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
    "&:hover": {
      backgroundColor: darken('#2d9cdb', 0.08)
    },
    "&:focus": {
      backgroundColor: darken('#2d9cdb', 0.24)
    },
  },
}), { name: 'CommentAdd' });

function CommentAdd(props) {
  const {
    intl, marketId, onSave, onCancel, type, investible, parent, hidden, issueWarningId,
  } = props;
  const [body, setBody] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [openIssue, setOpenIssue] = useState(false);
  const classes = useStyles();
  const placeHolderLabelId = getPlaceHolderLabelId(type);
  const placeHolder = intl.formatMessage({ id: placeHolderLabelId });
  const [, setOperationRunning] = useContext(OperationInProgressContext);

  function onEditorChange(content) {
    setBody(content);
  }

  function toggleIssue() {
    setOpenIssue(!openIssue);
  }

  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function handleSave() {
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
        const { id } = comment;
        return {
          spinChecker: () => checkIfCommentInStorage(marketId, id),
        };
      });
  }

  function handleCancel() {
    setBody('');
    setUploadedFiles([]);
    setOpenIssue(false);
    onCancel();
  }

  function handleSpinStop() {
    setBody('');
    setUploadedFiles([]);
    setOpenIssue(false);
    onSave();
  }

  const commentSaveLabel = parent ? 'commentAddSaveLabel' : 'commentReplySaveLabel';
  const commentCancelLabel = parent ? 'commentAddCancelLabel' : 'commentReplyCancelLabel';
  const showIssueWarning = issueWarningId !== null && type === ISSUE_TYPE;
  console.debug(`show issue warning is ${showIssueWarning}`);
  return (
    <Paper
      className={(hidden) ? classes.hidden : classes.add}
      elevation={2}
    >
      <div className={classes.editor}>
        <QuillEditor
          placeholder={placeHolder}
          defaultValue={body}
          onChange={onEditorChange}
          onS3Upload={onS3Upload}
          setOperationInProgress={setOperationRunning}
        >
          {!showIssueWarning && (
            <SpinBlockingButton
              className={classNames(classes.button, classes.buttonPrimary)}
              marketId={marketId}
              onClick={handleSave}
              onSpinStop={handleSpinStop}
              disabled={_.isEmpty(body)}
            >
              {intl.formatMessage({ id: commentSaveLabel })}
            </SpinBlockingButton>
          )}
          {showIssueWarning && (
            <Button className={classNames(classes.button, classes.buttonPrimary)} onClick={toggleIssue}>
              {intl.formatMessage({ id: commentSaveLabel })}
            </Button>
          )}
          {showIssueWarning && (
            <Modal
              aria-labelledby="simple-modal-title"
              aria-describedby="simple-modal-description"
              open={openIssue}
              className={classes.modal}
              onClose={toggleIssue}
            >
              <div className={classes.paper}>
                <h2 id="simple-modal-title">{intl.formatMessage({ id: 'warning' })}</h2>
                <p id="simple-modal-description">
                  {intl.formatMessage({ id: issueWarningId })}
                </p>
                <SpinBlockingButton
                  className={classNames(classes.button, classes.buttonPrimary)}
                  marketId={marketId}
                  onClick={handleSave}
                  onSpinStop={handleSpinStop}
                  disabled={_.isEmpty(body)}
                >
                  {intl.formatMessage({ id: commentSaveLabel })}
                </SpinBlockingButton>
              </div>
            </Modal>
          )}
          <Button
            onClick={handleCancel}
            className={classes.button}
          >
            {intl.formatMessage({ id: commentCancelLabel })}
          </Button>
        </QuillEditor>
      </div>
    </Paper>
  );
}

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
  onCancel: PropTypes.func.isRequired,
  hidden: PropTypes.bool,
};

CommentAdd.defaultProps = {
  parent: null,
  investible: null,
  hidden: false,
};

export default injectIntl(CommentAdd);
