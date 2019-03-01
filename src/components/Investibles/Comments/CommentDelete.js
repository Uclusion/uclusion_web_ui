import React from 'react';
import { connect } from 'react-redux';
import { DeleteForever } from '@material-ui/icons';
import PropTypes from 'prop-types';
import { injectIntl } from 'react-intl';
import { withTheme } from '@material-ui/core/styles/index';
import { deleteComment } from '../../../store/Comments/actions';


function CommentDelete(props) {


  function doDelete(){
    const { dispatch, marketId, investibleId, commentId } = props;
    dispatch(deleteComment({
      marketId,
      investibleId,
      commentId,
    }));
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

export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withTheme()(CommentDelete)));
