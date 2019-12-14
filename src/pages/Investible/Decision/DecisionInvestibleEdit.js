import React, { useContext, useState } from 'react';
import { injectIntl } from 'react-intl';
import {
  Card, CardActions, CardContent, TextField, withStyles,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { updateInvestible } from '../../../api/investibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { submitToModerator } from '../../../api/marketInvestibles';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getProposedOptionsStage,
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import { processTextAndFilesForSave } from '../../../api/files';

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

function DecisionInvestibleEdit(props) {
  const {
    fullInvestible, intl, classes, onCancel, onSave, marketId,
    isAdmin,
  } = props;

  const [marketStagesState] = useContext(MarketStagesContext);
  const inProposedStage = getProposedOptionsStage(marketStagesState, marketId);
  const myInvestible = fullInvestible.investible;
  const { id, description: initialDescription } = myInvestible;
  const [currentValues, setCurrentValues] = useState(myInvestible);
  const { name } = currentValues;
  const initialUploadedFiles = myInvestible.uploaded_files || [];
  const [uploadedFiles, setUploadedFiles] = useState(initialUploadedFiles);
  const [description, setDescription] = useState(initialDescription);

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

  function handleFileUpload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function saveInvestible() {
    const oldInvestibleUploadedFiles = myInvestible.uploaded_files || [];
    // uploaded files on edit is the union of the new uploaded files and the old uploaded files
    const newUploadedFiles = [...uploadedFiles, ...oldInvestibleUploadedFiles];
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(newUploadedFiles, description);
    const updateInfo = {
      uploadedFiles: filteredUploads,
      name,
      description: tokensRemoved,
      marketId,
      investibleId: id,
    };
    return updateInvestible(updateInfo);
  }

  function handleSave() {
    saveInvestible();
  }

  function handleSubmit() {
    return saveInvestible()
      .then(() => {
        const { market_infos: marketInfos } = fullInvestible;
        const marketInfo = marketInfos.find((info) => info.market_id === marketId);
        const stageInfo = {
          current_stage_id: marketInfo.stage,
          stage_id: inProposedStage.id,
        };
        const submitInfo = {
          marketId,
          investibleId: id,
          stageInfo,
        };
        return submitToModerator(submitInfo);
      });
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
        <QuillEditor
          handleFileUpload={handleFileUpload}
          onChange={onEditorChange}
          defaultValue={description}
        />
      </CardContent>
      <CardActions>
        <SpinBlockingButton
          marketId={marketId}
          onClick={onCancel}
        >
          {intl.formatMessage({ id: 'investibleEditCancelLabel' })}
        </SpinBlockingButton>
        <SpinBlockingButton
          marketId={marketId}
          variant="contained"
          color="primary"
          onClick={handleSave}
          onSpinStop={onSave}
        >
          {intl.formatMessage({ id: 'investibleEditSaveLabel' })}
        </SpinBlockingButton>
        {!isAdmin && (
          <SpinBlockingButton
            marketId={marketId}
            variant="contained"
            color="primary"
            onClick={handleSubmit}
            onSpinStop={onSave}
          >
            {intl.formatMessage({ id: 'investibleEditSubmitLabel' })}
          </SpinBlockingButton>
        )}
      </CardActions>
    </Card>

  );
}

DecisionInvestibleEdit.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  fullInvestible: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  isAdmin: PropTypes.bool,
};

DecisionInvestibleEdit.defaultProps = {
  onSave: () => {},
  onCancel: () => {},
  isAdmin: false,
};
export default withStyles(styles)(injectIntl(DecisionInvestibleEdit));
