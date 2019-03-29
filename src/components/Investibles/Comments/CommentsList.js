import { connect } from 'react-redux';
import { getComments } from '../../../store/Comments/reducer';
import CommentListItem from './CommentListItem';
import CommentsAdd from './CommentsAdd';
import React from 'react';
import Typography from '@material-ui/core/es/Typography/Typography';
import { injectIntl } from 'react-intl';
import { reverseDateComparator } from '../../../utils/comparators';
import PropTypes from 'prop-types';
import { withUserAndPermissions } from '../../UserPermissions/UserPermissions';

function CommentsList(props) {

  const { marketId, investibleId, intl, userPermissions } = props;
  const { isMarketAdmin } = userPermissions;

  function sortComments(commentsList) {
    commentsList.sort((c1, c2) => {
      return reverseDateComparator(c1.created_at, c2.created_at);
    });
  }

  function getListItems() {
    const { comments } = props;
    const marketComments = comments[marketId] || {};
    const myComments = marketComments[investibleId];
    if (!myComments || myComments.length === 0) {
      return <Typography>{intl.formatMessage({ id: 'noComments' })}</Typography>;
    }
    sortComments(myComments);
    return myComments.map(comment => (
      <CommentListItem key={comment.id} {...comment}/>
    ));
  }


  function userCanComment() {
    const { currentUserInvestment } = props;
    return isMarketAdmin || currentUserInvestment > 0;
  }

  function getCommentAddSection() {
    if (userCanComment()) {
      return <CommentsAdd investibleId={investibleId} marketId={marketId} />;
    }
    return <Typography>{intl.formatMessage({ id: 'investToComment' })}</Typography>;
  }

  return (
    <div>
      {getListItems()}
      {getCommentAddSection()}
    </div>
  );
}


CommentsList.propTypes = {
  intl: PropTypes.object.isRequired,
  comments: PropTypes.object,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
  currentUserInvestment: PropTypes.number,
  userPermissions: PropTypes.object.isRequired,
};

function mapStateToProps(state) {
  return {
    comments: getComments(state.commentsReducer),
  };
}

export default withUserAndPermissions(connect(mapStateToProps)(injectIntl(CommentsList)));
