import React from 'react';
import { DeleteForever } from '@material-ui/icons';
import PropTypes from 'prop-types';
import { deleteComment } from '../../../api/comments';

function CommentDelete(props) {

  function doDelete() {
    const { marketId, investibleId, commentId } = props;
    deleteComment(commentId, marketId, investibleId);
  }

  return (<DeleteForever onClick={() => doDelete()} />);
}

CommentDelete.propTypes = {
  dispatch: PropTypes.func.isRequired,
  marketId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  commentId: PropTypes.string.isRequired,
};


export default CommentDelete;
