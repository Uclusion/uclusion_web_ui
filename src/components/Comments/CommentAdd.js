import React, { useContext, useState } from 'react';
import { injectIntl } from 'react-intl';
import { Card, Button, ButtonGroup, CardContent, CardActions } from '@material-ui/core';
import QuillEditor from '../TextEditors/QuillEditor';
import { saveComment } from '../../api/comments';
import PropTypes from 'prop-types';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE, ISSUE_TYPE, REPLY_TYPE } from '../../containers/CommentBox/CommentBox';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { addComment } from '../../contexts/CommentsContext/commentsContextHelper';
import { processTextAndFilesForSave } from '../../api/files';

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

function CommentAdd(props) {
  const { intl, marketId, onSave, onCancel, type, investible, parent } = props;
  const [, commentsDispatch] = useContext(CommentsContext);
  const [body, setBody] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const placeHolderLabelId = getPlaceHolderLabelId(type);
  const placeHolder = intl.formatMessage({ id: placeHolderLabelId });

  function onEditorChange(content) {
    setBody(content);
  }

  function handleFileUpload(metadatas) {
    setUploadedFiles(metadatas);
    console.log(metadatas);
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
      .then((result) => {
        addComment(commentsDispatch, marketId, result);
        onSave();
      });
  }

  function handleCancel() {
    setBody('');
    setUploadedFiles([]);
    onCancel();
  }

  const commentSaveLabel = parent ? 'commentAddSaveLabel' : 'commentReplySaveLabel';
  const commentCancelLabel = parent ? 'commentAddCancelLabel' : 'commentReplyCancelLabel';

  return (
    <Card>
      <CardContent>
        <QuillEditor
          onS3Upload={handleFileUpload}
          placeholder={placeHolder}
          initialValue={body}
          onChange={onEditorChange} />
      </CardContent>
      <CardActions>
        <ButtonGroup variant="contained" size="small" color="primary">
          <Button onClick={handleSave}>
            {intl.formatMessage({ id: commentSaveLabel })}
          </Button>
          <Button onClick={handleCancel}>
            {intl.formatMessage({ id: commentCancelLabel })}
          </Button>
        </ButtonGroup>
      </CardActions>
    </Card>
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
  onCancel: PropTypes.func,
};

CommentAdd.defaultProps = {
  parent: null,
  investible: null,
  onCancel: () => {},
};

export default injectIntl(CommentAdd);
