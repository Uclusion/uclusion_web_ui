import React, { useContext, useEffect, useReducer, useState } from 'react';
import _ from 'lodash';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  TextField, Typography,
  withStyles,
} from '@material-ui/core';
import localforage from 'localforage';
import { useHistory } from 'react-router';
import { addPlanningInvestible } from '../../../api/investibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import AssignmentList from './AssignmentList';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import SpinBlockingButtonGroup from '../../../components/SpinBlocking/SpinBlockingButtonGroup';
import { checkInvestibleInStorage } from '../../../contexts/InvestibesContext/investiblesContextHelper';
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

function PlanningInvestibleAdd(props) {
  const {
    marketId, intl, classes, onCancel, onSave, storedDescription,
  } = props;

  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const history = useHistory();
  const emptyInvestible = { name: '', assignments: [] };
  const [currentValues, setCurrentValues] = useState(emptyInvestible);
  const [description, setDescription] = useState(storedDescription);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [assignments, setAssignments] = useState([]);
  const [validForm, setValidForm] = useState(false);
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
    if (name && !_.isEmpty(description)
      && !_.isEmpty(assignments)) {
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

  function onStorageChange(description) {
    localforage.setItem(`add_investible_${marketId}`, description);
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
      return {
        spinChecker: () => checkInvestibleInStorage(investibleId),
      };
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
        <Typography>
          {intl.formatMessage({ id: 'descriptionEdit' })}
        </Typography>
        <QuillEditor
          marketId={marketId}
          onChange={onEditorChange}
          onStoreChange={onStorageChange}
          placeholder={intl.formatMessage({ id: 'investibleAddDescriptionDefault' })}
          onS3Upload={onS3Upload}
          defaultValue={description}
          setOperationInProgress={setOperationRunning}
        />
      </CardContent>
      <CardActions>
        <SpinBlockingButtonGroup>
          <Button
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
        </SpinBlockingButtonGroup>
      </CardActions>
    </Card>

  );
}

PlanningInvestibleAdd.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object).isRequired,
  storedDescription: PropTypes.string.isRequired,
};

PlanningInvestibleAdd.defaultProps = {
  onSave: () => {
  },
  onCancel: () => {
  },
};

export default withStyles(styles)(injectIntl(PlanningInvestibleAdd));
