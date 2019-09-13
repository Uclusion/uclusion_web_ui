import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import { Card, TextField } from '@material-ui/core';
import { withStyles } from '@material-ui/core';

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
  const { investible, intl, classes } = props;
  const [currentValues, setCurrentValues] = useState(investible);
  const { name, description, id, market_id } = currentValues;

  function handleChange(field){
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
    };
  }

  return (
    <Card>
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
    </Card>

  );
}

export default withStyles(styles)(injectIntl(InvestibleEdit));
