import React, { useState } from 'react';
import PropTypes from 'prop-types';
import { Button, Card, CardActions, CardContent, TextField, withStyles } from '@material-ui/core';
import { updateMarket } from '../../api/markets';
import { injectIntl } from 'react-intl';

import useAsyncMarketsContext from '../../contexts/useAsyncMarketsContext';
import { filterUploadsUsedInText } from '../TextEditors/fileUploadFilters';

const styles = theme => ({
  root: {
    padding: theme.spacing(2),
  },
  row: {
    marginBottom: theme.spacing(2),
    '&:last-child': {
      marginBottom: 0,
    },
  },
});

function MarketEdit(props) {

  const {
    editToggle,
    onSave,
    editor,
    uploadedFiles,
    market,
    setMarket,
    classes,
    intl,
  } = props;
  const { id } = market;
  const { updateMarketLocally } = useAsyncMarketsContext();

  const { name, description } = market;
  console.debug(description);

  function handleChange(name) {
    return (event) => {
      const { value } = event.target;
      setMarket({ ...market, [name]: value });
    };
  }

  function handleSave() {
    console.debug(uploadedFiles);
    const filteredUploads = filterUploadsUsedInText(uploadedFiles, description);
    console.debug(filteredUploads);
    return updateMarket(id, name, description, filteredUploads)
      .then(() => updateMarketLocally(market))
      .then(() => onSave());
  }

  return (
    <Card>
      <CardContent>
        <TextField
          className={classes.row}
          inputProps={{ maxLength: 255 }}
          id="name"
          helperText={intl.formatMessage({ id: 'marketEditTitleLabel' })}
          margin="normal"
          fullWidth
          variant="outlined"
          value={name}
          onChange={handleChange('name')}
        />
        {editor}
      </CardContent>
      <CardActions>
        <Button onClick={editToggle}>
          {intl.formatMessage({ id: 'marketEditCancelLabel' })}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
        >
          {intl.formatMessage({ id: 'marketEditSaveLabel' })}
        </Button>
      </CardActions>
    </Card>
  );
}

MarketEdit.propTypes = {
  market: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
  editToggle: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
};

export default withStyles(styles)(injectIntl(MarketEdit));
