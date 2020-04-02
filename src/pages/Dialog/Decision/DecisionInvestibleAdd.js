import React, {
  useState, useContext, useEffect,
} from 'react';
import PropTypes from 'prop-types';
import {
  Button,
  Card,
  CardActions,
  CardContent,
  TextField,
} from '@material-ui/core';
import localforage from 'localforage';
import { addDecisionInvestible, addInvestibleToStage } from '../../../api/investibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import { processTextAndFilesForSave } from '../../../api/files';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import {
  formInvestibleLink,
  formMarketLink,
} from '../../../utils/marketIdPathFunctions'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import UclusionTour from '../../../components/Tours/UclusionTour';
import {
  PURE_SIGNUP_ADD_FIRST_OPTION,
  PURE_SIGNUP_ADD_FIRST_OPTION_STEPS, PURE_SIGNUP_FAMILY_NAME
} from '../../../components/Tours/pureSignupTours';
import CardType, { DECISION_TYPE, OPTION, VOTING_TYPE } from '../../../components/CardType'
import { FormattedMessage, useIntl } from 'react-intl'
import { createDecision } from '../../../api/markets'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { addParticipants } from '../../../api/users'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'

function DecisionInvestibleAdd(props) {
  const {
    marketId,
    classes,
    onCancel,
    isAdmin,
    onSave,
    storedState,
    hidden,
    onSpinComplete,
    parentInvestibleId,
    expirationMinutes,
  } = props;
  const intl = useIntl();
  const { description: storedDescription, name: storedName } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const [marketStagesState] = useContext(MarketStagesContext);
  const marketStages = getStages(marketStagesState, marketId) || [];
  const investmentAllowedStage = marketStages.find((stage) => stage.allows_investment) || {};
  const createdStage = marketStages.find((stage) => !stage.allows_investment) || {};
  const stageChangeInfo = {
    stage_id: investmentAllowedStage.id,
    current_stage_id: createdStage.id,
  };
  const emptyInvestible = { name: storedName, description: storedDescription };
  const [currentValues, setCurrentValues] = useState(emptyInvestible);
  const defaultClearFunc = () => {};
  //see https://stackoverflow.com/questions/55621212/is-it-possible-to-react-usestate-in-react for why we have a func
  // that returns  func for editorClearFunc
  const [editorClearFunc, setEditorClearFunc] = useState(() => defaultClearFunc);
  const [description, setDescription] = useState(storedDescription);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [validForm, setValidForm] = useState(false);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { name } = currentValues;
  const [marketPresencesState] = useContext(MarketPresencesContext);

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

  const itemKey = `add_investible_${marketId}`;
  function handleDraftState(newDraftState) {
    setDraftState(newDraftState);
    localforage.setItem(itemKey, newDraftState);
  }
  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
      handleDraftState({ ...draftState, [field]: value });
    };
  }


  function onEditorChange(description) {
    setDescription(description);
  }

  function onStorageChange(description) {
    localforage.getItem(itemKey).then((stateFromDisk) => {
      handleDraftState({ ...stateFromDisk, description });
    });
  }

  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function handleCancel() {
    const link = parentInvestibleId ? formInvestibleLink(marketId, parentInvestibleId) : formMarketLink(marketId);
    onCancel(link);
  }

  function handleNewInlineSave() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, description);
    const addDialogInfo = {
      name: 'NA',
      market_type: DECISION_TYPE,
      description: 'NA',
      is_inline: true,
      expiration_minutes: expirationMinutes,
    };
    return createDecision(addDialogInfo).then((result) => {
        const { market, stages } = result;
        const allowsInvestment = stages.find((stage) => stage.allows_investment);
        const notAllowsInvestment = stages.find((stage) => !stage.allows_investment);
        const stageInfo = {
          stage_id: allowsInvestment.id,
          current_stage_id: notAllowsInvestment.id,
        };
        const addInfo = {
          marketId: market.id,
          uploadedFiles: filteredUploads,
          description: tokensRemoved,
          name,
          stageInfo: stageInfo,
        };
        const marketPresences = getMarketPresences(marketPresencesState, marketId);
        const others = marketPresences.filter((presence) => !presence.current_user)
        if (others) {
          const participants = others.map((presence) => {
              return {
                user_id: presence.id,
                account_id: presence.account_id,
                is_observer: !presence.following
              };
          });
          return addParticipants(marketId, participants).then(() => addInvestibleToStage(addInfo));
        }
        return addInvestibleToStage(addInfo);
      }).then((investible) => {
        onSave(investible);
        const link = formInvestibleLink(marketId, parentInvestibleId);
        return {
          result: link,
          spinChecker: () => Promise.resolve(true),
        };
    });
  }

  function handleSave() {
    if (parentInvestibleId) {
      return handleNewInlineSave();
    }
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
    return promise.then((investible) => {
      // console.log('Adding investible to market');
      onSave(investible);
      const link = formMarketLink(marketId);
      return {
        result: link,
        //stop spinning immediately
        spinChecker: () => Promise.resolve(true),
      };
    });
  }

  function onSaveAddAnother() {
    localforage.removeItem(itemKey)
      .finally(() => {
        setCurrentValues({ name: '' });
        editorClearFunc();
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
      <CardType
        className={classes.cardType}
        label={`${intl.formatMessage({
          id: "decisionInvestibleDescription"
        })}`}
        type={VOTING_TYPE}
        subtype={OPTION}
      />
      <CardContent className={classes.cardContent}>
        <TextField
          fullWidth
          id="decision-investible-name"
          label={intl.formatMessage({ id: "agilePlanFormTitleLabel" })}
          onChange={handleChange('name')}
          placeholder={intl.formatMessage({
            id: "optionTitlePlaceholder"
          })}
          value={name}
          variant="filled"
        />
        <QuillEditor
          id="description"
          marketId={marketId}
          onChange={onEditorChange}
          onStoreChange={onStorageChange}
          placeholder={intl.formatMessage({ id: 'investibleAddDescriptionDefault' })}
          onS3Upload={onS3Upload}
          defaultValue={description}
          setOperationInProgress={setOperationRunning}
          setEditorClearFunc={(func) => {
            setEditorClearFunc(func);
          }}
        />
      </CardContent>
      <CardActions className={classes.actions}>
        <Button
          onClick={handleCancel}
          className={classes.actionSecondary}
          color="secondary"
          variant="contained"
        >
          <FormattedMessage
            id={"marketAddCancelLabel"}
          />
        </Button>
        <SpinBlockingButton
          id="save"
          onClick={handleSave}
          onSpinStop={onSpinComplete}
          className={classes.actionPrimary}
          color="primary"
          disabled={!validForm}
          hasSpinChecker
          marketId={marketId}
          variant="contained"
        >
          <FormattedMessage
            id={"agilePlanFormSaveLabel"}
          />
        </SpinBlockingButton>
        <SpinBlockingButton
          variant="contained"
          color="primary"
          disabled={!validForm}
          id="saveAddAnother"
          onClick={handleSave}
          hasSpinChecker
          marketId={marketId}
          onSpinStop={onSaveAddAnother}
        >
          <FormattedMessage
            id="decisionInvestibleSaveAddAnother"
          />
        </SpinBlockingButton>
      </CardActions>
    </Card>

  );
}

DecisionInvestibleAdd.propTypes = {
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  isAdmin: PropTypes.bool,
  storedState: PropTypes.object.isRequired,
  hidden: PropTypes.bool,
  onSpinComplete: PropTypes.func,
  parentInvestibleId: PropTypes.string,
  expirationMinutes: PropTypes.number,
};

DecisionInvestibleAdd.defaultProps = {
  onSave: () => {
  },
  onCancel: () => {
  },
  onSpinComplete: () => {},
  isAdmin: false,
  hidden: false,
};

export default DecisionInvestibleAdd;
