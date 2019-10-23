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

  const { intl, marketId, onSave, onCancel, issue, investible } = props;
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
    const filteredUploads = filterUploadsUsedInText(uploadedFiles, body);
    const investibleId = (investible) ? investible.id : null;
    return saveComment(marketId, investibleId, null, body, issue, filteredUploads)
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

  return (
    <Card>
      <CardActions>
        <Button onClick={handleSave}>
          {intl.formatMessage({ id: 'commentAddSaveLabel' })}
        </Button>
        <Button onClick={handleCancel}>
          {intl.formatMessage({ id: 'commentAddCancelLabel' })}
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
  onCancel: PropTypes.func,
};

export default injectIntl(CommentAdd);
