/* eslint-disable react/forbid-prop-types */
import React from 'react';
import { Grid, ListSubheader } from '@material-ui/core';
import Add from '@material-ui/icons/Add';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import { withUserAndPermissions } from '../UserPermissions/UserPermissions';

const styles = theme => ({
  subListWrapper: {
    padding: theme.spacing.unit,
    height: '100%',
    boxSizing: 'border-box',
  },
  subList: {
    height: '100%',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    padding: theme.spacing.unit,
    paddingTop: 0,
    backgroundColor: theme.palette.grey[theme.palette.type === 'dark' ? 900 : 300],
    borderRadius: 6,
  },
  subListHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  subListContent: {
    flex: 1,
    overflowY: 'auto',
  },
});

class QuickAddItemListCategory extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = { ...props, quickAddVisible: false };
    this.addOnClick = this.addOnClick.bind(this);
    this.addCancelOnClick = this.addCancelOnClick.bind(this);
    this.addSubmitOnClick = this.addSubmitOnClick.bind(this);
  }

  componentDidMount() {
    this.persistSelectedInvestibleScroll();
  }

  componentDidUpdate(prevProps) {
    const { items, selectedInvestibleIndex } = this.props;
    if (selectedInvestibleIndex !== prevProps.selectedInvestibleIndex || items !== prevProps.items) {
      this.persistSelectedInvestibleScroll();
    }
  }

  addOnClick = () => {
    this.setState({ quickAddVisible: !this.state.quickAddVisible });
  }

  addCancelOnClick = () => {
    this.setState({ quickAddVisible: false });
  }

  addSubmitOnClick = () => {
    this.setState({ quickAddVisible: false });
  }

  addSaveOnClick = (addOnSave, value) => {
    addOnSave(value); // save the item out, and then hide this
    this.setState({ quickAddVisible: false });
  }

  persistSelectedInvestibleScroll() {
    const { selectedInvestibleIndex } = this.props;
    if (selectedInvestibleIndex >= 0) {
      const scrollableContent = this.scrollableWrapper.childNodes[0];
      const investibleDom = scrollableContent.childNodes[selectedInvestibleIndex];
      const { top: contentTop, bottom: contentBottom } = this.scrollableWrapper.getBoundingClientRect();
      const { top: investibleTop, bottom: investibleBottom } = investibleDom.getBoundingClientRect();
      if (investibleTop < contentTop || investibleBottom > contentBottom) {
        const newScrollTop = (investibleTop + this.scrollableWrapper.scrollTop) - contentTop;
        this.scrollableWrapper.scrollTop = newScrollTop;
      }
    }
  }

  render() {
    const {
      classes,
      title,
      items,
      quickAdd,
      width,
      userPermissions,
    } = this.props;
    const { canCreateInvestible } = userPermissions;
    const myQuickAdd = React.cloneElement(
      quickAdd,
      {
        visible: this.state.quickAddVisible,
        addSubmitOnClick: this.addSubmitOnClick,
        addCancelOnClick: this.addCancelOnClick,
      },
    );

    return (
      <div
        className={classes.subListWrapper}
        style={width === 'xs' ? {} : { minWidth: 400, maxWidth: 400 }}
      >
        <div className={classes.subList}>
          <ListSubheader component="div" className={classes.subListHeader}>
            {title}
            {canCreateInvestible && (<Add onClick={this.addOnClick} />)}
          </ListSubheader>
          <div
            className={classes.subListContent}
            ref={(ref) => {
              this.scrollableWrapper = ref;
            }}
          >
            {myQuickAdd}
            <Grid
              container
              direction="column"
              justify="flex-start"
              alignItems="stretch"
              wrap="nowrap"
            >
              {items}
            </Grid>
          </div>
        </div>
      </div>
    );
  }
}


QuickAddItemListCategory.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  title: PropTypes.string.isRequired,
  userPermissions: PropTypes.object.isRequired,
  selectedInvestibleIndex: PropTypes.number.isRequired,
};

export default compose(
  withWidth(),
  withStyles(styles, { withTheme: true }),
)(withUserAndPermissions(QuickAddItemListCategory));
