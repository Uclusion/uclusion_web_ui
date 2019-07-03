import { connect } from 'react-redux';
import { getComments } from '../../../store/Comments/reducer';
import CommentListItem from './CommentListItem';
import CommentsAdd from './CommentsAdd';
import React from 'react';
import Typography from '@material-ui/core/es/Typography/Typography';
import { injectIntl } from 'react-intl';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { reFormatComments } from '../../../utils/reduxHelperFunctions';
import { getFlags } from '../../../utils/userFunctions'

function CommentsList(props) {

  const { marketId, investibleId, intl, user } = props;
  const { isAdmin } = getFlags(user);

  function sortComments(comments) {
    const formatted = reFormatComments(comments);
    const sorted = _.sortBy(formatted, ['created_at']);
    return sorted.reverse();
  }

  function getListItems() {
    const { comments } = props;
    const marketComments = comments[marketId] || {};
    const myComments = marketComments[investibleId];
    if (!myComments || myComments.length === 0) {
      return <Typography>{intl.formatMessage({ id: 'noComments' })}</Typography>;
    }
    const sorted = sortComments(myComments);
    return sorted.map(comment => (
      <CommentListItem user={user} key={comment.id} {...comment}/>
    ));
  }


  function userCanComment() {
    const { currentUserInvestment } = props;
    return isAdmin || currentUserInvestment > 0;
  }

  function getCommentAddSection() {
    return <CommentsAdd investibleId={investibleId} marketId={marketId} />;
  }

  return (
    <div>
      {getCommentAddSection()}
      {getListItems()}

    </div>
  );
}


CommentsList.propTypes = {
  intl: PropTypes.object.isRequired,
  comments: PropTypes.object,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  currentUserInvestment: PropTypes.number,
  user: PropTypes.object.isRequired,
};

function mapStateToProps(state) {
  return {
    comments: getComments(state.commentsReducer),
  };
}

export default connect(mapStateToProps)(injectIntl(CommentsList));
