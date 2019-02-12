import { connect } from 'react-redux';
import { getComments } from '../../../store/Comments/reducer';
import CommentListItem from './CommentListItem';
import CommentsAdd from './CommentsAdd';
import React from 'react';


function CommentsList(props) {

  const { investibleId } = props;

  function getListItems() {
    const { investibleComments } = props;
    const myComments = investibleComments[investibleId];
    if (!myComments) {
      return [];
    }
    return myComments.map((comment) => (
        <CommentListItem key={comment.id} comment={comment} />
    ));
  }

  return (
    <div>
      {getListItems()}
      <CommentsAdd investibleId={investibleId} />
    </div>
  );
}

function mapStateToProps(state) {
  return {
    investibleComments: getComments(state.commentsReducer),
  };
}

export default connect(mapStateToProps)(CommentsList);
