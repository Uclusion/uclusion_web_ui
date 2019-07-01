import React from 'react';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import SwipeableViews from 'react-swipeable-views';

const styles = theme => ({
  itemList: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },

  headerBox: {
    display: 'flex',
    justifyContent: 'space-between',
  },

  headerTitle: {
    float: 'left',
  },

  headerButton: {
    float: 'right',
  },

  headerBottom: {
    clear: 'both',
  },

  mainGrid: {
    flex: 1,
    display: 'flex',
    overflow: 'auto',
  },

});

class ItemList extends React.PureComponent {
  // TODO: this may need to change to pasing in the panels, sice we probably want to customize the entire list (e.g. just render the children in the list
  render() {
    const {
      classes, items, headerActions, width,
    } = this.props;
    const positionedHeaderActions = headerActions.map((element, index) => (
      <div
        key={index}
        className={classes.headerButton}
      >
        {element}
      </div>
    ));
    return (
      <div className={classes.itemList}>
        <div className={classes.headerBox}>
          {positionedHeaderActions}
        </div>
        <div className={classes.headerBottom} />

        {width === 'xs' ? (
          <SwipeableViews
            style={{ flex: 1 }}
            containerStyle={{ height: '100%' }}
            enableMouseEvents
            resistance
          >
            {items}
          </SwipeableViews>
        ) : (
          <div className={classes.mainGrid}>
            {items}
          </div>
        )}
      </div>
    );
  }
}


ItemList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  headerActions: PropTypes.arrayOf(PropTypes.object),
};

export default compose(
  withWidth(),
  withStyles(styles, { withTheme: true }),
)(ItemList);
