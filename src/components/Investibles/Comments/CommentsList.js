import { connect } from 'react-redux';
import { getComments } from '../../../store/Comments/reducer';
import CommentListItem from './CommentListItem';
import React from 'react';


function CommentsList(props){

  function getListItems(){
    const { investibleId, investibleComments } = props;
    const myComments = investibleComments[investibleId];
    return myComments.map((comment) => (
      <CommentListItem comment={comment} />
    ));
  }

  return (
    <div>
      {getListItems()}
    </div>
  );
}

function mapStateToProps(state){
  return {
    investibleComments: getComments(state.commentsReducer),
  };
}

export default connect(mapStateToProps)(CommentsList);
