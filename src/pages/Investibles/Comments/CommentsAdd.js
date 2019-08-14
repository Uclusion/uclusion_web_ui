import React, { useState } from 'react';
import Paper from '@material-ui/core/es/Paper/Paper';
import { injectIntl } from 'react-intl';
import Button from '@material-ui/core/es/Button/Button';
import { ERROR, sendIntlMessage } from '../../../utils/userMessage';
import HtmlRichTextEditor from '../../../components/TextEditors/HtmlRichTextEditor';
import { createComment } from '../../../api/comments';
import PropTypes from 'prop-types';

function CommentsAdd (props) {
  const { body, setBody } = useState('');
  const { marketId, investibleId, maxCommentSize, intl } = props;

  function addOnClick() {
    if (body.length === 0) {
      sendIntlMessage(ERROR, { id: 'commentRequired' });
      return;
    }
    if (body.length > maxCommentSize) {
      sendIntlMessage(ERROR, { id: 'commentTooManyBytes' });
      return;
    }
    createComment(investibleId, body, marketId)
      .then(() => {
        setBody('');
      });
  }

  function handleChange(event) {
    const { value } = event.target
    setBody(value);
  }

  function validateAddState () {
    const bodyValid = body && (body !== '<p></p>');
    // console.log(description);
    return bodyValid;
  }

  return (
    <Paper>
      <HtmlRichTextEditor value={body} placeHolder={intl.formatMessage({ id: 'commentBody' })} onChange={handleChange}/>
      <Button
        variant="contained"
        fullWidth
        color="primary"
        onClick={addOnClick}
        disabled={validateAddState()}
      >
        {intl.formatMessage({ id: 'saveCommentButton' })}
      </Button>
    </Paper>
  );

}
CommentsAdd.propTypes = {
  intl: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  maxCommentSize: PropTypes.number.isRequired,
};

export default injectIntl(CommentsAdd);
