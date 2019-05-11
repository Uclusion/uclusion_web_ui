import PropTypes from 'prop-types';
import React from 'react';
import { Paper, Grid, Typography } from '@material-ui/core';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import CategoryDelete from './CategoryDelete';

const styles = theme => ({
  itemCell: {
    padding: theme.spacing.unit,
  },
  itemContent: {
    display: 'flex',
    padding: theme.spacing.unit * 2,
    justifyContent: 'space-between',
  },
  title: {
    display: 'flex',
    marginBottom: theme.spacing.unit,

  },
  titleText: {
    flex: 1,
    fontWeight: 'bold',
    maxWidth: 315,
    wordWrap: 'break-word',
  },
});

const CategoryListItem = ({
  intl,
  name,
  classes,
  investiblesIn,
}) => (
  <Grid className={classes.itemCell} item xs={12} sm={6} md={4} lg={3} xl={2}>
    <Paper className={classes.itemContent}>
      <div>
        <div className={classes.title}>
          <Typography className={classes.titleText}>{name}</Typography>

        </div>
        <Typography>
          {(investiblesIn > 0)
            ? `${investiblesIn} ${intl.formatMessage({ id: 'investibles' })}`
            : intl.formatMessage({ id: 'investibleListNotFound' })
          }
        </Typography>
      </div>
      {(!investiblesIn || investiblesIn === 0) && <CategoryDelete name={name} />}
    </Paper>
  </Grid>
);

CategoryListItem.propTypes = {
  name: PropTypes.string.isRequired,
  investiblesIn: PropTypes.number,
};

CategoryListItem.defaultProps = {
  investiblesIn: 0,
};

export default injectIntl(withStyles(styles)(CategoryListItem));
