import React, { useContext, useState } from 'react';
import { useIntl } from 'react-intl';
import { Button, Card, CardActions, CardContent, TextField, Typography, withStyles } from '@material-ui/core';
import QuillEditor from '../TextEditors/QuillEditor';
import ExpirationSelector from './ExpirationSelector';
import { createMarket } from '../../api/markets';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { addMarket } from '../../contexts/MarketsContext/marketsContextReducer';

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
  const [description, setDescription] = useState('');
  const { name, expiration_minutes } = currentValues;
  const [, marketsDispatch] = useContext(MarketsContext);


  function zeroCurrentValues() {
    setCurrentValues(emptyMarket);
    setDescription('');
  }

  function handleCancel() {
    zeroCurrentValues();
    onCancel();
  }

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
    };
  }

  function onEditorChange(description) {
    setDescription(description);
  }

  function handleSave() {
    return createMarket(name, description, expiration_minutes)
      .then((result) => {
        const { market_id } = result;
        // result only contains the ID, we need to fill in some other stuff
        console.debug(result);
        const artificalMarket = {
          id: market_id,
          name,
          description,
          expiration_minutes,
          market_type: "DECISION",
          market_stage: "Active",
          // force update  calls to consider this entry old
          created_at: new Date(0),
          updated_at: new Date(0),
        };
        marketsDispatch(addMarket(artificalMarket));
        return artificalMarket;
      }).then(() => onSave());
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
          {intl.formatMessage({ id: 'marketAddExpirationLabel' }, {x: expiration_minutes / 1440 })}
        </Typography>
        <ExpirationSelector value={expiration_minutes} className={classes.row} onChange={handleChange('expiration_minutes')} />
        <QuillEditor
          onChange={onEditorChange}
          placeHolder={intl.formatMessage({id: 'marketAddDescriptionDefault' })}
          defaultValue={description} />
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