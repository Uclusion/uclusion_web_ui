import React, { useContext, useState } from 'react';
import { SearchIndexContext } from '../../contexts/SearchIndexContext/SearchIndexContext';
import { TextField, Card, Typography } from '@material-ui/core';

function SearchBox (props) {

  const [index] = useContext(SearchIndexContext);
  const [currentSearch, setCurrentSearch] = useState('');
  const [currentResults, setCurrentResults] = useState([]);

  function onSearchChange (event) {
    const { value } = event.target;
    setCurrentSearch(value);
    const results = index.search(value);
    setCurrentResults(results);
  }

  function getResults () {
    return currentResults.map((item) => {
      const { id, type } = item;
      return (
        <Card key={id}>
          <Typography>{id}</Typography>
          <Typography>{type}</Typography>
        </Card>
      );
    });
  }

  return (
    <div>
      <TextField
        onChange={onSearchChange}
        value={currentSearch}
      />
      {getResults()}
    </div>
  );
}

export default SearchBox;