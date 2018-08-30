import React from 'react'
import {
  ExpansionPanel,
  ExpansionPanelDetails,
  ExpansionPanelSummary,
  GridList,
  GridListTile,
  ListSubheader
} from '@material-ui/core'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'

class ItemList extends React.Component {

  //TODO: this may need to change to pasing in the panels, sice we probably want to customize the entire list (e.g. just render the children in the list
  render () {
    const { title, items } = this.props;
    return(<GridList cols={1} cellHeight="auto">
      <GridListTile key="Subheader" cols="1">
        <ListSubheader component="div">{title}</ListSubheader>
      </GridListTile>
      {items.map((item) =>
        <ExpansionPanel>
          <ExpansionPanelSummary expandIcon={<ExpandMoreIcon/>}>{item.summaryText}</ExpansionPanelSummary>
          <ExpansionPanelDetails>{item.expandedText}</ExpansionPanelDetails>
        </ExpansionPanel>)
      }
    </GridList>);
  };
}

export default ItemList;