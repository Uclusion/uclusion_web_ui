
import CommentListItem from './CommentListItem';
import CommentsAdd from './CommentsAdd';
import React from 'react';

import _ from 'lodash';
import PropTypes from 'prop-types';


function CommentsList(props) {

  const { marketId, investibleId, user } = props;

  function sortComments(comments) {
    const formatted = comments;
    const sorted = _.sortBy(formatted, ['created_at']);
    return sorted.reverse();
  }

  function getListItems() {
    const { comments } = props;
    const marketComments = comments[marketId] || {};
    const myComments = marketComments[investibleId];
    if (!myComments || myComments.length === 0) {
      return (<div />);
    }
    const sorted = sortComments(myComments);
    return sorted.map(comment => (
      <CommentListItem user={user} key={comment.id} {...comment}/>
    ));
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

  comments: PropTypes.object,
  investibleId: PropTypes.string.isRequired,
  marketId: PropTypes.string.isRequired,
};


export default CommentsList;
