import React from 'react'
import {
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  ExpansionPanelActions,
  GridList,
  Typography,
  Button
} from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { withStyles } from '@material-ui/core/styles'

const styles = (theme) => ({
  headerBox: {
    display: 'flex',
    justifyContent: 'space-between'
  },

  headerTitle: {
    float: 'left'
  },

  headerButton: {
    float: 'right'
  },

  headerBottom: {
    clear: 'both'
  }

})

class ItemList extends React.Component {
  // TODO: this may need to change to pasing in the panels, sice we probably want to customize the entire list (e.g. just render the children in the list
  render () {
    const { classes, title, items } = this.props
    return (<GridList cols={1} cellHeight='auto'>
      <div className={classes.headerBox}>
        <Typography variant='display1' className={classes.headerTitle} gutterBottom>
          {title}
        </Typography>
        <Button size='small' className={classes.headerButton}> TestRight </Button>
      </div>
      <div className={classes.headerBottom} />

      {items.map((item) =>
        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon />}>
            <Typography>
              {item.summaryText}
            </Typography>
            <Typography>
              Summary Division
            </Typography>
          </ExpansionPanelSummary>
          <ExpansionPanelDetails>{item.expandedText}</ExpansionPanelDetails>
          Some more text that I can use
          <ExpansionPanelActions>
            <Button size='small'>Cancel</Button>
            <Button size='small' color='primary'>
              Save
            </Button>
          </ExpansionPanelActions>
        </ExpansionPanel>)
      }
    </GridList>)
  };
}

export default withStyles(styles, { withTheme: true })(ItemList)
