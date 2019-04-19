import React, { useState } from 'react';
import { connect } from 'react-redux';
import { withTheme, withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import {
  FormControl,
  Input,
  InputLabel,
  InputAdornment,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import { withMarketId } from '../PathProps/MarketId';

const styles = theme => ({
  root: {
    margin: theme.spacing.unit,
    marginTop: theme.spacing.unit * 2,
    width: 384,
    [theme.breakpoints.only('xs')]: {
      width: '100%',
    },
  },
});

function TeamsSearchBox(props) {
  const [searchQuery, setSearchQuery] = useState(undefined);
  const {
    classes,
    intl,
  } = props;

  function doSearch(newQuery) {
    setSearchQuery(newQuery);
  }

  return (
    <FormControl className={classes.root}>
      <InputLabel htmlFor="adornment-search" shrink>Search Teams</InputLabel>
      <Input
        id="adornment-search"
        type="text"
        placeholder={intl.formatMessage({ id: 'searchBoxHelper' })}
        value={searchQuery}
        onChange={event => doSearch(event.target.value)}
        endAdornment={(
          <InputAdornment position="end">
            <SearchIcon />
          </InputAdornment>
        )}
      />
    </FormControl>
  );
}

function mapStateToProps(state) {
  return {
    //
  };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(mapStateToProps, mapDispatchToProps)(
  withStyles(styles)(withTheme()(withMarketId(injectIntl(TeamsSearchBox)))),
);
