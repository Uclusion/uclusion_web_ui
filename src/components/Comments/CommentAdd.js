import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import { Card, Button, CardContent, CardActions } from '@material-ui/core';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';
import { saveComment } from '../../api/comments';
import useAsyncCommentsContext from '../../contexts/useAsyncCommentsContext';
import PropTypes from 'prop-types';
import { filterUploadsUsedInText } from '../TextEditors/fileUploadFilters';

function CommentAdd(props) {

  const emptyComment = { body: '', uploadedFiles: []};
  const { intl, marketId, onSave, onCancel, issue, investible } = props;
  const { addCommentLocally } = useAsyncCommentsContext();
  const [currentValues, setCurrentValues] = useState(emptyComment);
  const { body, uploadedFiles } = currentValues;

  const placeHolderLabel = (issue) ? 'commentAddIssueDefault' : 'commentAddDefault';
  const placeHolder = intl.formatMessage({ id: placeHolderLabel });

  function handleChange(event) {
    const { value } = event.target;
    setCurrentValues({ body: value });
  }

  function handleFileUpload(metadata) {
    console.log(metadata);
    const uploadedFiles = currentValues.uploadedFiles || [];
    uploadedFiles.push(metadata);
    const newValues = { ...currentValues, uploadedFiles };
    setCurrentValues(newValues);
  }

  function handleSave() {
    const filteredUploads = filterUploadsUsedInText(body, uploadedFiles);
    const investibleId = (investible) ? investible.id : null;
    return saveComment(marketId, investibleId, null, body, issue, filteredUploads)
      .then((result) => addCommentLocally(result))
      .then(onSave());
  }

  function handleCancel() {
    setCurrentValues(emptyComment);
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
        <HtmlRichTextEditor
          handleFileUpload={handleFileUpload}
          placeHolder={placeHolder}
          value={body}
          onChange={handleChange}/>
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
