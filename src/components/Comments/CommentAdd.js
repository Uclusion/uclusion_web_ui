import React, { useContext, useState } from 'react';
import { injectIntl } from 'react-intl';
import { Card, Button, CardContent, CardActions } from '@material-ui/core';
import QuillEditor from '../TextEditors/QuillEditor';
import { saveComment } from '../../api/comments';

import PropTypes from 'prop-types';
import { filterUploadsUsedInText } from '../TextEditors/fileUploadFilters';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { addComment } from '../../contexts/CommentsContext/commentsContextHelper';

function CommentAdd(props) {

  const { intl, marketId, onSave, onCancel, issue, investible, parent } = props;
  const [, commentsDispatch] = useContext(CommentsContext);
  const [body, setBody] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);

  const placeHolderLabel = (issue) ? 'commentAddIssueDefault' : 'commentAddDefault';
  const placeHolder = intl.formatMessage({ id: placeHolderLabel });

  function onEditorChange(content) {
    setBody(content);
  }

  function handleFileUpload(metadatas) {
    console.debug(metadatas);
    const newUploadedFiles = [...uploadedFiles, ...metadatas];
    console.debug(newUploadedFiles);
    setUploadedFiles(newUploadedFiles);
  }

  function handleSave() {
    const usedParent = parent || {};
    const { investible_id: parentInvestible, id: parentId } = usedParent;
    const filteredUploads = filterUploadsUsedInText(uploadedFiles, body);
    const investibleId = (investible) ? investible.id : parentInvestible;
    return saveComment(marketId, investibleId, parentId, body, issue, filteredUploads)
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
      <CardActions>
        <Button onClick={handleSave}>
          {intl.formatMessage({ id: commentSaveLabel })}
        </Button>
        <Button onClick={handleCancel}>
          {intl.formatMessage({ id: commentCancelLabel })}
        </Button>
      </CardActions>
      <CardContent>
        <QuillEditor
          onS3Upload={handleFileUpload}
          placeholder={placeHolder}
          initialValue={body}
          onChange={onEditorChange}/>
      </CardContent>

    </Card>
  );
}

CommentAdd.propTypes = {
  issue: PropTypes.bool,
  marketId: PropTypes.string.isRequired,
  onSave: PropTypes.func.isRequired,
  intl: PropTypes.object.isRequired,
  investible: PropTypes.object,
  parent: PropTypes.string,
  onCancel: PropTypes.func,
};

export default injectIntl(CommentAdd);
