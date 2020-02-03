import React, {
  useState, useContext, useEffect,
} from 'react';
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
import { addDecisionInvestible, addInvestibleToStage } from '../../../api/investibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { formInvestibleLink, formMarketLink } from '../../../utils/marketIdPathFunctions';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext';
import { checkInvestibleInStorage } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import SpinBlockingButtonGroup from '../../../components/SpinBlocking/SpinBlockingButtonGroup';
import UclusionTour from '../../../components/Tours/UclusionTour';
import {
  PURE_SIGNUP_ADD_FIRST_OPTION,
  PURE_SIGNUP_ADD_FIRST_OPTION_STEPS, PURE_SIGNUP_FAMILY_NAME
} from '../../../components/Tours/pureSignupTours';

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

function DecisionInvestibleAdd(props) {
  const {
    marketId,
    intl,
    classes,
    onCancel,
    isAdmin,
    onSave,
    storedDescription,
    hidden
  } = props;

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
  const [description, setDescription] = useState(storedDescription);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [validForm, setValidForm] = useState(false);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { name } = currentValues;

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
    onCancel(formMarketLink(marketId));
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
    const promise = isAdmin ? addInvestibleToStage(addInfo) : addDecisionInvestible(addInfo);
    return promise.then((investibleId) => {
      const link = isAdmin ? formInvestibleLink(marketId, investibleId) : formMarketLink(marketId);
      return {
        result: link,
        spinChecker: () => checkInvestibleInStorage(investibleId),
      };
    });
  }

  return (
    <Card>
      <UclusionTour
        hidden={hidden}
        shouldRun={isAdmin}
        family={PURE_SIGNUP_FAMILY_NAME}
        name={PURE_SIGNUP_ADD_FIRST_OPTION}
        steps={PURE_SIGNUP_ADD_FIRST_OPTION_STEPS}
      />
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
        <Typography>
          {intl.formatMessage({ id: 'descriptionEdit' })}
        </Typography>
        <QuillEditor
          id="description"
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
            variant="contained"
            color="primary"
            id="save"
            onClick={handleSave}
            disabled={!validForm}
            marketId={marketId}
            onSpinStop={onSave}
          >
            {intl.formatMessage({ id: 'investibleAddSaveLabel' })}
          </SpinBlockingButton>
        </SpinBlockingButtonGroup>
      </CardActions>
    </Card>

  );
}

DecisionInvestibleAdd.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  isAdmin: PropTypes.bool,
  storedDescription: PropTypes.string.isRequired,
  hidden: PropTypes.bool,
};

DecisionInvestibleAdd.defaultProps = {
  onSave: () => {
  },
  onCancel: () => {
  },
  isAdmin: false,
  hidden: false,
};

export default withStyles(styles)(injectIntl(DecisionInvestibleAdd));
