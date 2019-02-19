import { connect } from 'react-redux';
import { getComments } from '../../../store/Comments/reducer';
import CommentListItem from './CommentListItem';
import CommentsAdd from './CommentsAdd';
import React from 'react';
import Typography from '@material-ui/core/es/Typography/Typography';
import { injectIntl } from 'react-intl';
import { reverseDateComparator } from '../../../utils/comparators';

function CommentsList(props) {

  const { investibleId, intl } = props;


  function sortComments(commentsList) {
    commentsList.sort((c1, c2) => {
      return reverseDateComparator(c1.created_at, c2.created_at);
    });
  }

  function getListItems() {
    const { investibleComments } = props;
    const myComments = investibleComments[investibleId];
    if (!myComments || myComments.length === 0) {
      return <Typography>{intl.formatMessage({ id: 'noComments' })}</Typography>;
    }
    sortComments(myComments);
    return myComments.map((comment, index) => (
      <CommentListItem key={index} {...comment}/>
    ));
  }


  function userCanComment() {
    const { currentUserInvestment } = props;
    return currentUserInvestment > 0;
  }

  function getCommentAddSection() {
    if (userCanComment()) {
      return <CommentsAdd investibleId={investibleId} />;
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

function mapStateToProps(state) {
  return {
    investibleComments: getComments(state.commentsReducer),
  };
}

export default connect(mapStateToProps)(injectIntl(CommentsList));
