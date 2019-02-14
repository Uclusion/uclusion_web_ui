import React from 'react';
import {
  Grid,
  ListSubheader,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';


const styles = theme => ({
  subList: {
    padding: theme.spacing.unit,
  },
});

class ItemListCategory extends React.PureComponent {
  render() {
    const { classes, items, title } = this.props;
    return (
      <div className={classes.subList}>
        {title && <ListSubheader component="div">{title}</ListSubheader> }
        <Grid container direction="column" justify="flex-start" alignItems="stretch">
          {items}
        </Grid>
      </div>
    );
  }
}


ItemListCategory.propTypes = {
  items: PropTypes.arrayOf(PropTypes.object).isRequired,
  title: PropTypes.string,
};

export default withStyles(styles, { withTheme: true })(ItemListCategory);
