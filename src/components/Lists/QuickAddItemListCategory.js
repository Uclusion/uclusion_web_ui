/* eslint-disable react/forbid-prop-types */
import React from 'react';
import { Grid, ListSubheader, IconButton, Typography, Tooltip } from '@material-ui/core';
import Add from '@material-ui/icons/Add';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';
import { getFlags } from '../../utils/userFunctions'

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
    marginLeft: -theme.spacing.unit,
    marginRight: -theme.spacing.unit,
    marginBottom: -theme.spacing.unit,
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    paddingBottom: theme.spacing.unit,
    paddingTop: theme.spacing.unit * 0.5,
  },
  titleText: {
    maxWidth: 315,
    wordWrap: 'break-word',
    lineHeight: '2em',
  },
});

class QuickAddItemListCategory extends React.PureComponent {

  componentDidMount() {
    this.persistSelectedInvestibleScroll();
  }

  componentDidUpdate(prevProps) {
    const { items, selectedInvestibleIndex } = this.props;
    if (selectedInvestibleIndex !== prevProps.selectedInvestibleIndex || items !== prevProps.items) {
      this.persistSelectedInvestibleScroll();
    }
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
      width,
      user,
      tooltip
    } = this.props;
    const { isUser, isAdmin } = getFlags(user);
    return (
      <div
        className={classes.subListWrapper}
       >
        <div className={classes.subList}>
          <div
            className={classes.subListContent}
            ref={(ref) => {
              this.scrollableWrapper = ref;
            }}
          >
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
  tooltip: PropTypes.string.isRequired,
  user: PropTypes.object.isRequired,
  selectedInvestibleIndex: PropTypes.number.isRequired,
};

export default compose(
  withWidth(),
  withStyles(styles, { withTheme: true }),
)(QuickAddItemListCategory);
