import React, { useContext, useState } from 'react';
import { injectIntl } from 'react-intl';
import {
  Card, CardActions, CardContent, TextField, withStyles,
} from '@material-ui/core';
import PropTypes from 'prop-types';
import { updateInvestible } from '../../../api/investibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import { getMarketInfo } from '../../../utils/userFunctions';
import AssignmentList from '../../Dialog/Planning/AssignmentList';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import ReadOnlyQuillEditor from '../../../components/TextEditors/ReadOnlyQuillEditor';
import { getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';

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

function PlanningInvestibleEdit(props) {
  const {
    fullInvestible, intl, classes, onCancel, onSave, marketId,
  } = props;
  const myInvestible = fullInvestible.investible;
  const marketInfo = getMarketInfo(fullInvestible, marketId) || {};
  const { assigned } = marketInfo || [];
  const { id, description: initialDescription } = myInvestible;
  const [currentValues, setCurrentValues] = useState(myInvestible);
  const [assignments, setAssignments] = useState(assigned);
  const { name } = currentValues;
  const initialUploadedFiles = myInvestible.uploaded_files || [];
  const [uploadedFiles, setUploadedFiles] = useState(initialUploadedFiles);
  const [description, setDescription] = useState(initialDescription);
  const [marketsState] = useContext(MarketsContext);
  const me = getMyUserForMarket(marketsState, marketId) || {};
  const { id: myId } = me;
  const assignee = assigned.includes(myId);

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

  function handleSave() {
    // uploaded files on edit is the union of the new uploaded files and the old uploaded files
    const oldInvestibleUploadedFiles = myInvestible.uploaded_files || [];
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
      assignments,
    };
    return updateInvestible(updateInfo);
  }

  function handleAssignmentChange(newAssignments) {
    setAssignments(newAssignments);
  }

  return (
    <Card>
      <CardContent>
        <AssignmentList
          marketId={marketId}
          previouslyAssigned={assigned}
          onChange={handleAssignmentChange}
        />
        <TextField
          className={classes.row}
          inputProps={{ maxLength: 255 }}
          id="name"
          helperText={intl.formatMessage({ id: 'investibleEditTitleLabel' })}
          margin="normal"
          fullWidth
          variant="outlined"
          value={name}
          disabled={!assignee}
          onChange={handleChange('name')}
        />
        {assignee && (
        <QuillEditor
          handleFileUpload={handleFileUpload}
          onChange={onEditorChange}
          defaultValue={description}
        />
        )}
        {!assignee && (
          <ReadOnlyQuillEditor
            value={description}
          />
        )}
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
      </CardActions>
    </Card>

  );
}

PlanningInvestibleEdit.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  fullInvestible: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
};

PlanningInvestibleEdit.defaultProps = {
  onSave: () => {},
  onCancel: () => {},
};
export default withStyles(styles)(injectIntl(PlanningInvestibleEdit));
