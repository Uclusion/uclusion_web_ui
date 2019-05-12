import React, { Component } from 'react';
import PropTypes from 'prop-types';
import List from '@material-ui/core/List';
import ListItem from '@material-ui/core/ListItem';
import ListItemIcon from '@material-ui/core/ListItemIcon';
import ListItemText from '@material-ui/core/ListItemText';
import ListItemSecondaryAction from '@material-ui/core/ListItemSecondaryAction';
import Divider from '@material-ui/core/Divider';
import { withTheme, withStyles } from '@material-ui/core/styles';
import IconButton from '@material-ui/core/IconButton';
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight';
import ArrowBack from '@material-ui/icons/ArrowBack';

const styles = theme => ({
  root: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: theme.palette.background.paper,
  },
  icon: {
    color: theme.palette.primary.contrastText,
  },
  listItemIcon: {
    marginRight: 0,
  },
});

class SelectableMenuList extends Component {
  state = {}

  handleNestedItemsClick = (item) => {
    if (item.nestedItems) {
      const previousItems = this.state.previousItems ? this.state.previousItems : [];
      const items = item.nestedItems;
      const title = item.primaryText;

      previousItems.unshift(this.state.items ? this.state.items : items);

      this.setState({ items, previousItems, title });
    }
  }

  handleBackClick = (item) => {
    const previousItems = this.state.previousItems ? this.state.previousItems : [];
    const items = previousItems[0] ? previousItems[0] : undefined;

    previousItems.shift();

    this.setState({ items, previousItems });
  }

  getNestedItems = (hostItem, hostIndex) => {
    if (hostItem.nestedItems !== undefined) {
      const items = hostItem.nestedItems.filter(item => item.visible !== false);

      if (items.length > 0) {
        return items.map((item, i) => this.getItem(item, hostIndex.toString() + i.toString()));
      }
    }

    return null;
  };

  handleClickItem = item => (e) => {
    const { onIndexChange } = this.props;

    if (item.value) {
      onIndexChange(e, item.value);
    }
    this.handleNestedItemsClick(item);
    if (item.onClick) {
      item.onClick();
    }
  }

  getItem = (item, i) => {
    const { useMinified, classes } = this.props;

    delete item.visible;

    if (item !== undefined) {
      if (item.subheader !== undefined) {
        return (
          <div
            key={i}
            inset={item.inset}
            style={item.style}
          >
            {item.subheader}
          </div>
        );
      } if (item.divider !== undefined) {
        return (
          <Divider
            key={i}
            inset={item.inset}
            style={item.style}
          />
        );
      }
      return (
        <ListItem
          button
          key={i}
          onClick={this.handleClickItem(item)}
          onMouseDown={(e) => {
            if (e.button === 1) {
              const win = window.open(`${item.value}`, '_blank');
              win.focus();
            }
          }}
        >
          {item.leftIcon
            && (
              <ListItemIcon className={classes.listItemIcon}>
                {item.leftIcon}
              </ListItemIcon>
            )
          }

          <ListItemText primary={item.primaryText} />

          {item.nestedItems
            && (
            <ListItemSecondaryAction>
              <IconButton
                style={{ paddingLeft: useMinified ? 30 : undefined }}
                onClick={this.handleClickItem(item)}
              >
                <KeyboardArrowRight color="action" />
              </IconButton>
            </ListItemSecondaryAction>
            )
          }
        </ListItem>
      );
    }

    return null;
  }

  render() {
    const {
      items,
      onIndexChange,
      index,
      classes,
    } = this.props;

    const list = this.state.previousItems && this.state.previousItems.length > 0 ? this.state.items : items;

    return (
      <List
        value={index}
        onChange={onIndexChange}
      >
        {this.state.items && this.state.previousItems && this.state.previousItems.length > 0
          && (
          <div>
            <ListItem
              button
              onClick={(e) => {
                this.handleBackClick();
              }}
            >
              <ListItemIcon className={classes.listItemIcon}>
                <ArrowBack />
              </ListItemIcon>
              <ListItemText primary={this.state.title} />
            </ListItem>
            <Divider />
          </div>
          )

        }
        {
          list.filter(item => item.visible !== false).map((item, i) => this.getItem(item, i))
        }
      </List>
    );
  }
}

SelectableMenuList.propTypes = {
  items: PropTypes.array.isRequired,
  onIndexChange: PropTypes.func.isRequired,
  index: PropTypes.string.isRequired,
};

export default withTheme()(withStyles(styles, { withTheme: true })(SelectableMenuList));
