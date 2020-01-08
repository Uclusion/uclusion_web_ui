import React, { useEffect, useState } from 'react';
import { injectIntl } from 'react-intl';
import {
  Card, CardActions, CardContent, TextField, Typography, withStyles,
} from '@material-ui/core';
import localforage from 'localforage';
import PropTypes from 'prop-types';
import { updateInvestible } from '../../../api/investibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
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

function InitiativeInvestibleEdit(props) {
  const {
    fullInvestible, intl, classes, onCancel, onSave, marketId, storedDescription,
  } = props;

  const myInvestible = fullInvestible.investible;
  const { id, description: initialDescription } = myInvestible;
  const [currentValues, setCurrentValues] = useState(myInvestible);
  const [validForm, setValidForm] = useState(true);
  const { name } = currentValues;
  const initialUploadedFiles = myInvestible.uploaded_files || [];
  const [uploadedFiles, setUploadedFiles] = useState(initialUploadedFiles);
  const [description, setDescription] = useState(storedDescription || initialDescription);

  useEffect(() => {
    // Long form to prevent flicker
    if (name && description && description.length > 0) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, description, validForm]);

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
    };
  }

  function onEditorChange(description) {
    setDescription(description);
    localforage.setItem(id, description);
  }

  function onStorageChange(description) {
    localforage.setItem(id, description);
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
        <Typography>
          {intl.formatMessage({ id: 'descriptionEdit' })}
        </Typography>
        <QuillEditor
          handleFileUpload={handleFileUpload}
          onChange={onEditorChange}
          onStoreChange={onStorageChange}
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
          disabled={!validForm}
          onSpinStop={onSave}
        >
          {intl.formatMessage({ id: 'investibleEditSaveLabel' })}
        </SpinBlockingButton>
      </CardActions>
    </Card>

  );
}

InitiativeInvestibleEdit.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  fullInvestible: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  storedDescription: PropTypes.string.isRequired,
};

InitiativeInvestibleEdit.defaultProps = {
  onSave: () => {},
  onCancel: () => {},
};
export default withStyles(styles)(injectIntl(InitiativeInvestibleEdit));
