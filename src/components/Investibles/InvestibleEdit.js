import React, { useState } from 'react';
import { injectIntl } from 'react-intl';
import {
  Button, Card, CardActions, CardContent, TextField, withStyles,
} from '@material-ui/core';
import { updateInvestible } from '../../api/investibles';
import HtmlRichTextEditor from '../TextEditors/HtmlRichTextEditor';
import useAsyncInvestiblesContext from '../../contexts/useAsyncInvestiblesContext';
import useAsyncMarketPresencesContext from '../../contexts/useAsyncMarketPresencesContext';
import { updateInvestibleStage } from '../../api/marketInvestibles';
import useAsyncMarketStagesContext from '../../contexts/useAsyncMarketStagesContext';

const styles = (theme) => ({
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
  const { getCurrentUser } = useAsyncMarketPresencesContext();
  const { getCachedStages } = useAsyncMarketStagesContext();
  const {
    investible, intl, classes, editToggle, onSave, marketId,
  } = props;
  const [currentValues, setCurrentValues] = useState(investible.investible);
  const { name, description, id } = currentValues;

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
    };
  }

  function handleSave() {
    return updateInvestible(marketId, id, name, description)
      .then((data) => updateInvestibleLocally({ ...investible, investible: data }))
      .then(() => onSave());
  }

  function handleSubmit() {
    let newStage;
    return handleSave().then(() => getCurrentUser(marketId)).then((currentUser) => {
      const stages = getCachedStages(marketId);
      if (currentUser.is_admin) {
        newStage = stages.find((stage) => stage.appears_in_market_summary);
      } else {
        // Submit to moderation
        newStage = stages.find((stage) => !stage.appears_in_market_summary
          && stage.visible_to_roles.length === 1);
      }
      return updateInvestibleStage(marketId, id, newStage.id, investible.stage_id);
    })
      .then(() => updateInvestibleLocally({ ...investible, stage_name: newStage.name }));
  }

  return (
    <Card>
      <CardContent>
        <TextField
          className={classes.row}
          inputProps={{ maxLength: 255 }}
          id="name"
          helperText={intl.formatMessage({ id: 'investibleEditTitleLabel' })}
          margin="normal"
          fullWidth
          variant="outlined"
          value={name}
          onChange={handleChange('name')}
        />
        <HtmlRichTextEditor
          onChange={handleChange('description')}
          value={description}
        />
      </CardContent>
      <CardActions>
        <Button onClick={editToggle}>
          {intl.formatMessage({ id: 'investibleEditCancelLabel' })}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSave}
        >
          {intl.formatMessage({ id: 'investibleEditSaveLabel' })}
        </Button>
        <Button
          variant="contained"
          color="primary"
          onClick={handleSubmit}
        >
          {intl.formatMessage({ id: 'investibleEditSubmitLabel' })}
        </Button>
      </CardActions>
    </Card>

  );
}

export default withStyles(styles)(injectIntl(InvestibleEdit));
