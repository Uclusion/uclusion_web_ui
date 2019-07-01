/* eslint-disable react/forbid-prop-types */
import React from 'react';
import { Grid } from '@material-ui/core';
import PropTypes from 'prop-types';
import { compose } from 'redux';
import { withStyles } from '@material-ui/core/styles';
import withWidth from '@material-ui/core/withWidth';

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

class SelectableItemList extends React.PureComponent {

  componentDidMount() {
    this.persistSelectedInvestibleScroll();
  }

  componentDidUpdate(prevProps) {
    const { items, selectedItemIndex } = this.props;
    if (selectedItemIndex !== prevProps.selectedItemIndex || items !== prevProps.items) {
      this.persistSelectedInvestibleScroll();
    }
  }


  persistSelectedInvestibleScroll() {
    const { selectedItemIndex } = this.props;
    if (selectedItemIndex >= 0) {
      const scrollableContent = this.scrollableWrapper.childNodes[0];
      const itemDom = scrollableContent.childNodes[selectedItemIndex];
      const { top: contentTop, bottom: contentBottom } = this.scrollableWrapper.getBoundingClientRect();
      const { top: investibleTop, bottom: investibleBottom } = itemDom.getBoundingClientRect();
      if (investibleTop < contentTop || investibleBottom > contentBottom) {
        const newScrollTop = (investibleTop + this.scrollableWrapper.scrollTop) - contentTop;
        this.scrollableWrapper.scrollTop = newScrollTop;
      }
    }
  }

  render() {
    const {
      classes,
      items,
      user,
    } = this.props;
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


SelectableItemList.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  selectedItemIndex: PropTypes.number.isRequired,
};

export default compose(
  withWidth(),
  withStyles(styles, { withTheme: true }),
)(SelectableItemList);
