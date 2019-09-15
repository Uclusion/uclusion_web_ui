import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import { Button, Card, CardActions, CardContent, TextField, withStyles } from '@material-ui/core';
import { updateInvestible } from '../../api/investibles';
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

function InvestibleEdit(props) {
  const { updateInvestibleLocally } = useAsyncInvestiblesContext();
  const { investible, intl, classes, editToggle, onSave } = props;
  const [currentValues, setCurrentValues] = useState(investible);
  const { name, description, id, market_id } = currentValues;

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
    };
  }

  function handleSave() {
    return updateInvestible(market_id, id, name, description)
      .then(investible => updateInvestibleLocally(investible))
      .then(() => onSave());
  }

  return (
    <Card>
      <CardContent>
        <TextField
          className={classes.row}
          inputProps={{ maxLength: 255 }}
          InputLabelProps={{ shrink: true }}
          id="name"
          label={intl.formatMessage({ id: 'investibleEditTitleLabel' })}
          margin="normal"
          fullWidth
          value={name}
          onChange={handleChange('name')}
        />
        <HtmlRichTextEditor
          onChange={handleChange('description')}
          value={description} />
      </CardContent>
      <CardActions>
        <Button onClick={editToggle}>
          {intl.formatMessage({ id: 'investibleEditCancelLabel'})}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
        >
          {intl.formatMessage({ id: 'investibleEditSaveLabel' })}
        </Button>
      </CardActions>
    </Card>

  );
}

export default withStyles(styles)(injectIntl(InvestibleEdit));
