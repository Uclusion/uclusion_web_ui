import React, { useContext, useEffect, useReducer, useState } from 'react';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  TextField,
  withStyles,
} from '@material-ui/core';
import { useHistory } from 'react-router';
import { addPlanningInvestible } from '../../../api/investibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import AssignmentList from './AssignmentList';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext';

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
  const {
    marketId, intl, classes, onCancel, onSave,
  } = props;

  const history = useHistory();
  const emptyInvestible = { name: '', assignments: [] };
  const [currentValues, setCurrentValues] = useState(emptyInvestible);
  const [description, setDescription] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [validForm, setValidForm] = useState(false);
  const [operationRunning] = useContext(OperationInProgressContext);
  const { name } = currentValues;
  const [, addInvestibleDispatch] = useReducer((state, action) => {
    const { link } = action;
    if (link) {
      return { navigationLink: link };
    }
    const { navigationLink } = state;
    if (navigationLink) {
      onSave();
      navigate(history, navigationLink);
    }
    return {};
  }, {});

  useEffect(() => {
    // Long form to prevent flicker
    if (name && description && description.length > 0
      && Array.isArray(assignments) && assignments.length > 0) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, description, assignments, validForm]);

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
    };
  }

  function onAssignmentsChange(newAssignments) {
    setAssignments(newAssignments);
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
      assignments,
    };
    return addPlanningInvestible(addInfo).then((investibleId) => {
      const link = formInvestibleLink(marketId, investibleId);
      addInvestibleDispatch({ link });
      return link;
    });
  }

  return (
    <Card>
      <CardContent>
        <AssignmentList
          marketId={marketId}
          onChange={onAssignmentsChange}
        />
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
          defaultValue={description}
        />
      </CardContent>
      <CardActions>
        <Button
          disabled={operationRunning}
          onClick={handleCancel}
        >
          {intl.formatMessage({ id: 'investibleAddCancelLabel' })}
        </Button>
        <SpinBlockingButton
          marketId={marketId}
          variant="contained"
          color="primary"
          onClick={handleSave}
          disabled={!validForm}
          onSpinStop={() => addInvestibleDispatch({})}
        >
          {intl.formatMessage({ id: 'investibleAddSaveLabel' })}
        </SpinBlockingButton>
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
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object).isRequired,
};

InvestibleAdd.defaultProps = {
  onSave: () => {
  },
  onCancel: () => {
  },
};

export default withStyles(styles)(injectIntl(InvestibleAdd));
