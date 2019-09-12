import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import { Card, Button } from '@material-ui/core';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';
import { saveComment } from '../../api/comments';
import useAsyncMarketsContext from '../../contexts/useAsyncMarketsContext';

function CommentReply(props) {

  const { parent, intl, marketId } = props;
  const { refreshMarketComments } = useAsyncMarketsContext();
  const [ body, setBody ] = useState('');

  const placeHolder = intl.formatMessage({ id: 'commentReplyDefault' });

  function handleChange(event) {
    const { value } = event.target;
    setBody(value);
  }

  function handleSave(){
    const usedParent = parent || {};
    const { investible_id, id } = parent;
    return saveComment(marketId, investible_id, id, body)
      .then(() => refreshMarketComments(marketId));
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
