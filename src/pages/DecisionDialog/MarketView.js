import React from 'react';
import PropTypes from 'prop-types';
import { Card, CardActions, CardContent } from '@material-ui/core';
import QuillEditor from '../../components/TextEditors/QuillEditor';
import CommentBox from '../../containers/CommentBox/CommentBox';
import MarketEditButton from './MarketEditButton';

function MarketView(props) {
  const { market, comments, commentsHash, editToggle } = props;
  const { description, id } = market;

  return (
    <div>
      <Card>
        <CardContent>
          <MarketEditButton onClick={editToggle} />
          <QuillEditor marketId={id} defaultValue={description} readOnly />
        </CardContent>
        <CardActions>

        </CardActions>
      </Card>
      <CommentBox
        marketId={id}
        comments={comments}
        commentsHash={commentsHash}
        depth={0}
      />
    </div>
  );
}

MarketView.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  comments: PropTypes.arrayOf(PropTypes.object).isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  commentsHash: PropTypes.object.isRequired,
  editToggle: PropTypes.func.isRequired,
};

export default MarketView;
