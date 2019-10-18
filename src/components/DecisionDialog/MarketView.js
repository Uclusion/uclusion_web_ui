import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, CardActions, CardContent } from '@material-ui/core';
import QuillEditor from '../TextEditors/QuillEditor';
import CommentBox from '../../containers/CommentBox/CommentBox';
import MarketEditButton from './MarketEditButton';
import { useIntl } from 'react-intl';
import CommentAdd from '../Comments/CommentAdd';

function MarketView(props) {
  const intl = useIntl();
  const { market, comments, commentsHash, editToggle } = props;
  const { description, id } = market;
  const [addIssue, setAddIssue] = useState(false);
  console.debug(market);
  function toggleAddIssue() {
    setAddIssue(!addIssue);
  }

  return (
    <div>
      <Card>
        <CardContent>
          <MarketEditButton onClick={editToggle} />
          <QuillEditor value={description} readOnly />
        </CardContent>
        <CardActions>
          <Button onClick={toggleAddIssue}>
            {intl.formatMessage({ id: 'marketViewAddIssueLabel' })}
          </Button>
        </CardActions>
      </Card>
      {addIssue && <CommentAdd investible={null} marketId={id} onSave={toggleAddIssue} issue onCancel={toggleAddIssue} />}
      <CommentBox marketId={id}
                  comments={comments}
                  commentsHash={commentsHash}
                  depth={0} />
    </div>
  );
}

MarketView.propTypes = {
  market: PropTypes.object.isRequired,
  comments: PropTypes.arrayOf(PropTypes.object),
  commentsHash: PropTypes.object,
  editToggle: PropTypes.func.isRequired,
};

export default MarketView;
