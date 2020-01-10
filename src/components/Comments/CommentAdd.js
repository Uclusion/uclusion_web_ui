import React, { useContext, useState } from 'react';
import { injectIntl } from 'react-intl';
import _ from 'lodash';
import {
  Card, Button, ButtonGroup, CardContent, CardActions, makeStyles,
} from '@material-ui/core';
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

const useStyles = makeStyles(() => ({
  hidden: {
    display: 'none',
  },
  add: {
    display: 'flex',
  },
  editor: {
    flex: 1,
  },
  primaryButton: {
    width: '57px',
    marginLeft: '4px',
    backgroundColor: '#2d9cdb',
    height: '41px',
    color: '#fff',
    borderRadius: '4px',
    fontSize: '10px',
    fontWeight: 'bold',
    textTransform: 'capitalize',
  },
}));

function CommentAdd(props) {
  const {
    intl, marketId, onSave, onCancel, type, investible, parent, hidden,
  } = props;
  const [body, setBody] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const classes = useStyles();
  const placeHolderLabelId = getPlaceHolderLabelId(type);
  const placeHolder = intl.formatMessage({ id: placeHolderLabelId });
  const [operationRunning] = useContext(OperationInProgressContext);

  function onEditorChange(content) {
    setBody(content);
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
    onCancel();
  }

  function handleSpinStop() {
    setBody('');
    setUploadedFiles([]);
    onSave();
  }

  const commentSaveLabel = parent ? 'commentAddSaveLabel' : 'commentReplySaveLabel';
  const commentCancelLabel = parent ? 'commentAddCancelLabel' : 'commentReplyCancelLabel';

  return (
    <div
      className={(hidden) ? classes.hidden : classes.add}
    >
      <div className={classes.editor}>
        <QuillEditor
          placeholder={placeHolder}
          defaultValue={body}
          onChange={onEditorChange}
          noToolbar={true}
        />
      </div>
      <SpinBlockingButton
        className={classes.primaryButton}
        marketId={marketId}
        onClick={handleSave}
        onSpinStop={handleSpinStop}
        disabled={_.isEmpty(body)}
      >
        {intl.formatMessage({ id: commentSaveLabel })}
      </SpinBlockingButton>
      <Button
        onClick={handleCancel}
        className={classes.primaryButton}
      >
        {intl.formatMessage({ id: commentCancelLabel })}
      </Button>
    </div>
  );
}

CommentAdd.propTypes = {
  type: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
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
