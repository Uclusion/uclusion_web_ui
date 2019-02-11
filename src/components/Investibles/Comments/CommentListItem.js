import React from 'react'
import ListItem from '@material-ui/core/ListItem';
import { Typography } from '@material-ui/core'

class CommentListItem extends React.Component {

  render(){
    const { comment } = this.props
    return (
      <div>
        {comment}
      </div>
    )
  }
}