import React, { useState, useContext, useReducer } from 'react';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  FormControlLabel,
  Switch,
  TextField,
  withStyles,
} from '@material-ui/core';
import { useHistory } from 'react-router';
import { addDecisionInvestible, addInvestibleToStage } from '../../../api/investibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
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
    marketId, intl, classes, onCancel, isAdmin, onSave,
  } = props;

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
  const [addDirectToVoting, setAddDirectToVoting] = useState(true);
  const [operationRunning] = useContext(OperationInProgressContext);
  const [, addInvestibleDispatch] = useReducer((state, action) => {
    const { link } = action;
    if (link) {
      return { navigationLink: link };
    }
    const { navigationLink } = state;
    onSave();
    navigate(history, navigationLink);
    return {};
  }, {});
  const { name } = currentValues;

  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
    };
  }

  function handleAddDirect(event) {
    const { checked } = event.target;
    setAddDirectToVoting(checked);
  }

  function onEditorChange(description) {
    setDescription(description);
  }

  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function zeroCurrentValues() {
    setAddDirectToVoting(false);
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
      stageInfo: stageChangeInfo, // ignored by addDecisionInvestible
    };
    const promise = addDirectToVoting ? addInvestibleToStage(addInfo)
      : addDecisionInvestible(addInfo);
    return promise.then((investibleId) => {
      const link = formInvestibleLink(marketId, investibleId);
      addInvestibleDispatch({ link });
      return link;
    });
  }


  return (
    <Card>
      <CardContent>
        {isAdmin && (
          <FormControlLabel
            control={<Switch onChange={handleAddDirect} checked={addDirectToVoting} />}
            label={intl.formatMessage({ id: 'investibleAddDirectLabel' })}
          />
        )}
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
          variant="contained"
          color="primary"
          onClick={handleSave}
          marketId={marketId}
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
