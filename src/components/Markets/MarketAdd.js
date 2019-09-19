import React, { useState } from 'react';
import { useIntl } from 'react-intl';
import { Button, Card, CardActions, CardContent, TextField, Typography, withStyles } from '@material-ui/core';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';
import ExpirationSelector from './ExpirationSelector';

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

function MarketAdd(props) {
  const intl = useIntl();
  const { onSave, onCancel, classes } = props;
  const emptyMarket = { name: '', description: '', expiration_minutes: 1440 };
  const [currentValues, setCurrentValues] = useState(emptyMarket);
  const { name, description, expiration_minutes } = currentValues

  function zeroCurrentValues() {
    setCurrentValues(emptyMarket);
  }

  function handleCancel() {
    zeroCurrentValues();
    onCancel();
  }

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      console.log(value);
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
    };
  }


  function handleSave() {
    return Promise.resolve('True');
  }

  return (
    <Card>
      <CardContent>
        <TextField
          className={classes.row}
          inputProps={{ maxLength: 255 }}
          id="name"
          helperText={intl.formatMessage({ id: 'marketAddTitleLabel' })}
          placeholder={intl.formatMessage({ id: 'marketAddTitleDefault' })}
          margin="normal"
          fullWidth
          variant="outlined"
          value={name}
          onChange={handleChange('name')}
        />
        <Typography className={classes.row}>
          {intl.formatMessage({ id: 'marketAddExpirationLabel' })}
        </Typography>
        <ExpirationSelector value={expiration_minutes} className={classes.row} onChange={handleChange('expiration_minutes')} />
        <HtmlRichTextEditor
          onChange={handleChange('description')}
          placeHolder={intl.formatMessage({id: 'marketAddDescriptionDefault' })}
          value={description} />
      </CardContent>
      <CardActions>
        <Button onClick={handleCancel}>
          {intl.formatMessage({ id: 'marketAddCancelLabel'})}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
        >
          {intl.formatMessage({ id: 'marketAddSaveLabel' })}
        </Button>
      </CardActions>
    </Card>
  );
}

export default withStyles(styles)(MarketAdd);