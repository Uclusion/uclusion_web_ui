import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import { Card, Button } from '@material-ui/core';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';
import { saveComment } from '../../api/comments';
import useAsyncCommentsContext from '../../contexts/useAsyncCommentsContext';

function CommentReply(props) {

  const { parent, intl, marketId, onSave } = props;
  const { addCommentLocally } = useAsyncCommentsContext();
  const [body, setBody] = useState('');

  const placeHolder = intl.formatMessage({ id: 'commentReplyDefault' });

  function handleChange(event) {
    const { value } = event.target;
    setBody(value);
  }

  function handleSave() {
    const usedParent = parent || {};
    const { investible_id, id: parentId } = usedParent;
    return saveComment(marketId, investible_id, parentId, body)
      .then(result => addCommentLocally(result))
      .then(onSave());
  }

  return (
    <Card>
      <HtmlRichTextEditor placeHolder={placeHolder} value={body} onChange={handleChange} />
      <Button onClick={handleSave}>
        {intl.formatMessage({ id: 'commentReplySaveLabel' })}
      </Button>
    </Card>
  );
}

export default injectIntl(CommentReply);
