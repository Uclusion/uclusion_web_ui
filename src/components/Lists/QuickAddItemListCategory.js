import React from 'react'
import { Grid, ListSubheader } from '@material-ui/core'
import Add from '@material-ui/icons/Add'
import PropTypes from 'prop-types'
import { withStyles } from '@material-ui/core/styles'


const styles = (theme) => ({
  subListWrapper: {
    padding: theme.spacing.unit,
  },
  subList: {
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing.unit,
    paddingTop: 0,
    backgroundColor: theme.palette.grey[theme.palette.type === 'dark' ? 900 : 300],
    borderRadius: 6
  },
  subListHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  subListContent: {
    flex: 1,
    overflowY: 'auto'
  }
});

class QuickAddItemListCategory extends React.Component {

  constructor (props) {
    super(props);
    this.state = {...props, quickAddVisible: false};
    this.addOnClick = this.addOnClick.bind(this);
    this.addCancelOnClick = this.addCancelOnClick.bind(this);
    this.addSubmitOnClick = this.addSubmitOnClick.bind(this);
  }

  addOnClick = () => {
    this.setState({quickAddVisible: !this.state.quickAddVisible});
  }

  addCancelOnClick = () => {
    this.setState({quickAddVisible: false});
  }

  addSubmitOnClick = () => {
    this.setState({quickAddVisible: false});
  }

  addSaveOnClick = (addOnSave, value) => {
      addOnSave(value); //save the item out, and then hide this
      this.setState({quickAddVisible: false});
  }

  render() {
    const {
      classes,
      title,
      items,
      quickAdd
    } = this.props;
    const myQuickAdd = React.cloneElement(
      quickAdd,
      {
        visible:this.state.quickAddVisible,
        addSubmitOnClick: this.addSubmitOnClick,
        addCancelOnClick: this.addCancelOnClick
      }
    );

    return (
      <div className={classes.subListWrapper}>
        <div className={classes.subList}>
          <ListSubheader component="div" className={classes.subListHeader}>
            {title}
            <Add onClick={this.addOnClick} />
          </ListSubheader>
          <div className={classes.subListContent}>
            {myQuickAdd}
            <Grid container direction="column" justify="flex-start" alignItems="stretch">
              {items}
            </Grid>
          </div>
        </div>
      </div>
    )
  }
}


QuickAddItemListCategory.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  title: PropTypes.string.isRequired
};

export default withStyles(styles, {withTheme: true})(QuickAddItemListCategory);
