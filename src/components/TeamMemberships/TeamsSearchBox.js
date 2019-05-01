import React, { useState } from 'react';

import { withTheme, withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import {
  FormControl,
  Input,
  InputLabel,
  InputAdornment,
} from '@material-ui/core';
import SearchIcon from '@material-ui/icons/Search';
import elasticlunr from 'elasticlunr/example/elasticlunr';
import ClearIcon from '@material-ui/icons/Clear';

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
    teams,
    onSearch,
  } = props;

  function getNewIndex(){
    return elasticlunr(function () {
      this.addField('id');
      this.addField('name');
      this.addField('description');
      this.setRef('id');
      this.pipeline.remove(elasticlunr.stopWordFilter);
      this.saveDocument(true);
    });
  }

  function clearSearch(){
    setSearchQuery('');
  }

  function getTeamDoc(team){
    return team;
  }



  function doSearch(newQuery) {
    // since we have teams passed in, we'll just immediately load
    const index = getNewIndex();
    for (const team of teams) {
      const doc = getTeamDoc(team);
      index.addDoc(doc);
    }
    const results = index.search(newQuery, { expand: true });
    if (onSearch) {
      onSearch({ query: newQuery, results });
    }
    setSearchQuery(newQuery);
  }

  return (
    <FormControl className={classes.root}>
      <InputLabel htmlFor="adornment-search" shrink>{intl.formatMessage({ id: 'teamsSearchBoxSearchTeams' })}</InputLabel>
      <Input
        id="adornment-search"
        type="text"
        placeholder={intl.formatMessage({ id: 'searchBoxHelper' })}
        value={searchQuery}
        onChange={event => doSearch(event.target.value)}
        startAdornment={(searchQuery && (
          <InputAdornment position="start">
            <ClearIcon onClick={() => clearSearch() }/>
          </InputAdornment>
        ))}
        endAdornment={(
          <InputAdornment position="end">
            <SearchIcon />
          </InputAdornment>
        )}
      />
    </FormControl>
  );
}


export default withStyles(styles)(withTheme()(injectIntl(TeamsSearchBox)));
