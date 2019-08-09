import React from 'react';
import { connect } from 'react-redux';
import { DeleteForever } from '@material-ui/icons';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { deleteComment } from '../../../api/comments';

function CommentDelete(props) {

  function doDelete() {
    const { dispatch, marketId, investibleId, commentId } = props;
    deleteComment(commentId, marketId, investibleId, dispatch);
  }

  return (<DeleteForever onClick={() => doDelete()} />);
}

CommentDelete.propTypes = {
  dispatch: PropTypes.func.isRequired,
  marketId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  commentId: PropTypes.string.isRequired,
};

function mapStateToProps(state) {
  return {}; // not used yet
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(CommentDelete));
