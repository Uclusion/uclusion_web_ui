import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import { Button, Card, CardActions, CardContent, TextField, withStyles } from '@material-ui/core';
import { addInvestible, updateInvestible } from '../../api/investibles';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';
import useAsyncInvestiblesContext from '../../contexts/useAsyncInvestiblesContext';

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
  const { addInvestibleLocally } = useAsyncInvestiblesContext();
  const { marketId, intl, classes, onSave, onCancel } = props;
  const [currentValues, setCurrentValues] = useState({ name: '', description: '' });
  const { name, description } = currentValues;

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
    };
  }

  function zeroCurrentValues() {
    setCurrentValues({ name: '', description: '' });
  }

  function handleCancel() {
    zeroCurrentValues();
    onCancel();
  }

  function handleSave() {
    return addInvestible(marketId, name, description)
      .then((investible) => {
        const { id } = investible;
        return addInvestibleLocally(investible)
          .then(() => zeroCurrentValues())
          .then(() => onSave(id));
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
        <HtmlRichTextEditor
          onChange={handleChange('description')}
          placeHolder={intl.formatMessage({id: 'investibleAddDescriptionDefault' })}
          value={description} />
      </CardContent>
      <CardActions>
        <Button onClick={handleCancel}>
          {intl.formatMessage({ id: 'investibleAddCancelLabel'})}
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
