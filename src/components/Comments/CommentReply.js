import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import { Card, Button, CardContent } from '@material-ui/core';
import QuillEditor from '../TextEditors/QuillEditor';
import { saveComment } from '../../api/comments';
import useAsyncCommentsContext from '../../contexts/useAsyncCommentsContext';
import CardActions from '@material-ui/core/CardActions';

function CommentReply(props) {

  const { parent, intl, marketId, onSave, onCancel } = props;
  const { addCommentLocally } = useAsyncCommentsContext();
  const [body, setBody] = useState('');

  const placeHolder = intl.formatMessage({ id: 'commentReplyDefault' });

  function onEditorChange(content) {
    const body = content;
    setBody(body);
  }

  function handleSave() {
    const usedParent = parent || {};
    const { investible_id, id: parentId } = usedParent;
    return saveComment(marketId, investible_id, parentId, body)
      .then((result) => addCommentLocally(result))
      .then(onSave());
  }

  function handleCancel() {
    setBody('');
    onCancel();
  }

  return (
    <Card>
      <CardContent>
        <QuillEditor placeHolder={placeHolder} initialValue={body} onChange={onEditorChange}/>
      </CardContent>
      <CardActions>
        <Button onClick={handleSave}>
          {intl.formatMessage({ id: 'commentReplySaveLabel' })}
        </Button>
        <Button onClick={handleCancel}>
          {intl.formatMessage({ id: 'commentReplyCancelLabel' })}
        </Button>
      </CardActions>
    </Card>
  );
}

export default injectIntl(CommentReply);
