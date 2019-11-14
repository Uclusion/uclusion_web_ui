import React, { useState, useContext } from 'react';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { Button, Card, CardActions, CardContent, TextField, withStyles } from '@material-ui/core';
import { addInvestible, addInvestibleToStage } from '../../../api/investibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { useHistory } from 'react-router';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';

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

function InvestibleAdd(props) {
  const { marketId, intl, classes, onCancel, isAdmin } = props;

  const history = useHistory();
  const [marketStagesState] = useContext(MarketStagesContext);
  const marketStages = getStages(marketStagesState, marketId) || [];
  const investmentAllowedStage = marketStages.find((stage) => stage.allows_investment);
  const createdStage = marketStages.find((stage) => !stage.allows_investment);
  const stageChangeInfo = {
    stage_id: investmentAllowedStage.id,
    current_stage_id: createdStage.id,
  };
  const emptyInvestible = { name: '', description: '' };
  const [currentValues, setCurrentValues] = useState(emptyInvestible);
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { name } = currentValues;

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

  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function zeroCurrentValues() {
    setCurrentValues(emptyInvestible);
    setDescription('');
  }

  function handleCancel() {
    zeroCurrentValues();
    onCancel();
  }

  function handleSave() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, description);
    const addInfo = {
      marketId,
      uploadedFiles: filteredUploads,
      description: tokensRemoved,
      name,
      stageInfo: stageChangeInfo, //ignored by add without stage info
    };
    const promise = isAdmin ? addInvestibleToStage(addInfo) : addInvestible(addInfo);
    return promise.then((investibleId) => {
      const link = formInvestibleLink(marketId, investibleId);
      return navigate(history, link);
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
          marketId={marketId}
          onChange={onEditorChange}
          placeholder={intl.formatMessage({ id: 'investibleAddDescriptionDefault' })}
          onS3Upload={onS3Upload}
          defaultValue={description}/>
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

InvestibleAdd.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onSave: PropTypes.func,
  onCancel: PropTypes.func,
  isAdmin: PropTypes.bool,
};

InvestibleAdd.defaultProps = {
  onSave: () => {
  },
  onCancel: () => {
  },
  isAdmin: false,
};

export default withStyles(styles)(injectIntl(InvestibleAdd));
