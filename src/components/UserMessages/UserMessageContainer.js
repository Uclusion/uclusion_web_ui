import React from 'react'
import PropTypes from 'prop-types'
import Snackbar from '@material-ui/core/Snackbar'
import UserMessageContent from './UserMessageContent'
import { connect } from 'react-redux'
import { getUserMessages } from '../../containers/UserMessages/reducer'
import UserMessageContent from './UserMessageContent' 

class UserMessageContainer extends React.Component {

  render () {
    const {userMessages} = this.props
    const content = userMessages.map((message) => {
      return <UserMessageContent message={message.message} variant={message.level}/>
      }
    )
    //todo deal with auto hide stuff
    return(
      <Snackbar open={true}>
        {content}
      </Snackbar>
    )
  }

}

const mapStateToProps = (state) => ({
  userMessages: getUserMessages(state.userMessagesReducer)
})

export default connect(mapStateToProps)(UserMessageContent)