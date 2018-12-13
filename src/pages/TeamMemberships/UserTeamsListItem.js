import PropTypes from 'prop-types'
import { connect } from 'react-redux'
import React from 'react'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { ExpansionPanel, ExpansionPanelDetails, ExpansionPanelSummary, Typography } from '@material-ui/core'
import Chip from '@material-ui/core/Chip'
import Avatar from '@material-ui/core/Avatar'
import PeopleIcon from '@material-ui/icons/People'
import classNames from 'classnames'
import { withStyles } from '@material-ui/core/styles'
import { injectIntl } from 'react-intl'
import { fetchTeamMembers } from '../../store/Teams/actions'
import { getTeamMembers } from '../../store/Teams/reducer'

const styles = (theme) => ({
  headerBox: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  details: {
    alignItems: 'center',
  },

  helper: {},

  investment: {
    display: 'inline-block'
  },

  column: {
    flexBasis: '33.33%',
  },

  mainGrid: {
    padding: theme.spacing.unit * 2,
    justifyContent: 'flex-end'
  },

  tabSection: {
    borderTop: `1px solid ${theme.palette.divider}`,
    display: 'block'
  },

  wholeWidth: {
    flexBasis: '100%'
  }
})

class UserTeamsListItem extends React.Component {

  listUsersOnClick(teamId){
    fetchTeamMembers(teamId)
  }
  //need fetching stuff. At this point it's probably better to make a component for it and use the loading/etc
  createMemberList(teamId){
    const members = inve
  }

  render () {
    const { id, name, description, numMembers, classes } = this.props
    return (
      <ExpansionPanel>
        <ExpansionPanelSummary className={classes.details} expandIcon={<ExpandMoreIcon onClick={() => this.listUsersOnclick(id)}/>}>
          <div className={classes.column}>
            <Typography>
              {name}
            </Typography>
            <div className={classes.wholeWidth}>
              <Typography>
                {description}
              </Typography>
            </div>
          </div>
          <div className={classes.column}/>
          <div className={classNames(classes.column, classes.helper)}>
            <Chip avatar={<Avatar><PeopleIcon/></Avatar>} label={numMembers}/>
          </div>

        </ExpansionPanelSummary>
        <ExpansionPanelDetails>

        </ExpansionPanelDetails>
      </ExpansionPanel>
    )
  }
}

UserTeamsListItem.propTypes = {
  id: PropTypes.string.isRequired,
  name: PropTypes.string.isRequired,
  description: PropTypes.string.isRequired,
  numMembers: PropTypes.number.isRequired,
  marketSharesAvailable: PropTypes.arrayOf(PropTypes.number).isRequired
}

const mapStateToProps = (state) => ({
  teamMembers: getTeamMembers(state.teamsReducer)
})

function mapDispatchToProps (dispatch) {
  return { dispatch }
}


export default connect(mapStateToProps, mapDispatchToProps)(injectIntl(withStyles(styles)(UserTeamsListItem)))