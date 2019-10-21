import React, { useState, useContext } from 'react';
import { injectIntl } from 'react-intl';
import { Button, Card, CardActions, CardContent, TextField, withStyles } from '@material-ui/core';
import { addInvestible } from '../../api/investibles';
import QuillEditor from '../TextEditors/QuillEditor';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { addInvestible as localAddInvestible } from '../../contexts/InvestibesContext/investiblesContextReducer';

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

function InvestibleAdd(props) {
  const [, dispatch] = useContext(InvestiblesContext);
  const { marketId, intl, classes, onSave, onCancel } = props;
  const emptyInvestible = { name: '', description: '' };
  const [currentValues, setCurrentValues] = useState(emptyInvestible);
  const { name, description } = currentValues;

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
    };
  }

  function onEditorChange(content) {
    const description = content;
    const newValues = { ...currentValues, description };
    setCurrentValues(newValues);
  }

  function zeroCurrentValues() {
    setCurrentValues(emptyInvestible);
  }

  function handleCancel() {
    zeroCurrentValues();
    onCancel();
  }

  function handleSave() {
    return addInvestible(marketId, name, description)
      .then((id) => {
        const syntheticInvestible = {
          investible: {
            id,
            name,
            description,
            updated_at: Date(0),
            created_at: Date(0),
          },
          market_infos: [{ market_id: marketId }]
        };
        dispatch(localAddInvestible(syntheticInvestible));
        zeroCurrentValues();
        onSave(id);
      });
  }

  return (
    <Card>
      <CardContent>
        <TextField
          className={classes.row}
          inputProps={{ maxLength: 255 }}
          id="name"
          helperText={intl.formatMessage({ id: 'investibleAddTitleLabel' })}
          placeholder={intl.formatMessage({ id: 'investibleAddTitleDefault' })}
          margin="normal"
          fullWidth
          variant="outlined"
          value={name}
          onChange={handleChange('name')}
        />
        <QuillEditor
          onChange={onEditorChange}
          placeholder={intl.formatMessage({ id: 'investibleAddDescriptionDefault' })}
          defaultValue={description} />
      </CardContent>
      <CardActions>
        <Button onClick={handleCancel}>
          {intl.formatMessage({ id: 'investibleAddCancelLabel' })}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
        >
          {intl.formatMessage({ id: 'investibleAddSaveLabel' })}
        </Button>
      </CardActions>
    </Card>

  );
}

export default withStyles(styles)(injectIntl(InvestibleAdd));
