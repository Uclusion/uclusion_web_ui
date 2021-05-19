import React, { useContext, useEffect, useState, } from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { Card, CardActions, CardContent, Checkbox, TextField, Typography, } from '@material-ui/core'
import localforage from 'localforage'
import ExpirationSelector from '../../components/Expiration/ExpirationSelector'
import { createDecision } from '../../api/markets'
import { processTextAndFilesForSave } from '../../api/files'
import { DECISION_TYPE } from '../../constants/markets'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useLocation } from 'react-router'
import queryString from 'query-string'
import CardType from '../../components/CardType'
import { usePlanFormStyles } from '../../components/AgilePlan'
import { formMarketManageLink } from '../../utils/marketIdPathFunctions'
import DismissableText from '../../components/Notifications/DismissableText'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getRequiredInputStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import _ from 'lodash'
import { addInvestible, getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import SpinningIconLabelButton from '../../components/Buttons/SpinningIconLabelButton'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import { usePlanInvestibleStyles } from '../Investible/Planning/PlanningInvestibleEdit'
import { editorReset, useEditor } from '../../components/TextEditors/quillHooks';
import { getQuillStoredState } from '../../components/TextEditors/QuillEditor2'

function DecisionAdd(props) {
  const intl = useIntl();
  const location = useLocation();
  const { hash } = location;
  const values = queryString.parse(hash);
  const { investibleId: parentInvestibleId, id: parentMarketId } = values;
  const {
    onSpinStop, storedState, onSave, createEnabled
  } = props;
  const { name: storedName, expiration_minutes: storedExpirationMinutes } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = usePlanFormStyles();
  const myClasses = usePlanInvestibleStyles();
  const emptyMarket = { name: storedName, expiration_minutes: storedExpirationMinutes || 1440 };
  const [validForm, setValidForm] = useState(false);
  const [currentValues, setCurrentValues] = useState(emptyMarket);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { name, expiration_minutes } = currentValues;
  const [investibleState, investibleDispatch] = useContext(InvestiblesContext);
  const [multiVote, setMultiVote] = useState(false);
  const [marketStagesState] = useContext(MarketStagesContext);

  const editorName = 'DecisionAddDialogAdd-editor';
  const editorSpec = {
    cssId: 'description',
    onUpload: onS3Upload,
    placeholder: intl.formatMessage({ id: 'marketAddDescriptionDefault' }),
    value: getQuillStoredState(editorName),
  }

  const [Editor, editorController] = useEditor(editorName, editorSpec);


  function toggleMultiVote() {
    setMultiVote(!multiVote);
  }

  useEffect(() => {
    // Long form to prevent flicker
    if (name && expiration_minutes > 0) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, expiration_minutes, validForm]);

  function handleCancel() {
    editorController(editorReset());
    onSpinStop();
  }

  const itemKey = `add_market_${DECISION_TYPE}`;
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

  /** This might not work if the newUploads it sees is always old * */
  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function handleSave() {
    setOperationRunning(true);
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, getQuillStoredState(editorName));
    const processedDescription = tokensRemoved ? tokensRemoved : ' ';
    const addInfo = {
      name,
      uploaded_files: filteredUploads,
      market_type: DECISION_TYPE,
      description: processedDescription,
      expiration_minutes,
      allow_multi_vote: multiVote,
    };

    if (parentInvestibleId) {
      addInfo.parent_investible_id = parentInvestibleId;
    }
    if (parentMarketId) {
      addInfo.parent_market_id = parentMarketId;
    }
    return createDecision(addInfo)
      .then((result) => {
        editorController(editorReset());
        const { market } = result;
        onSave(result);
        const { id: marketId } = market;
        if (parentInvestibleId && parentMarketId) {
          // Quick add the investible move to requires input
          const requiresInputStage = getRequiredInputStage(marketStagesState, parentMarketId);
          if (requiresInputStage) {
            const inv = getInvestible(investibleState, parentInvestibleId);
            if (inv) {
              const { market_infos, investible: rootInvestible } = inv;
              const [info] = (market_infos || []);
              if (info) {
                const newInfo = {
                  ...info,
                  stage: requiresInputStage.id,
                  stage_name: requiresInputStage.name,
                  open_for_investment: false,
                  last_stage_change_date: Date.now().toString(),
                };
                const newInfos = _.unionBy([newInfo], market_infos, 'id');
                const newInvestible = {
                  investible: rootInvestible,
                  market_infos: newInfos
                };
                // no diff here, so no diff dispatch
                addInvestible(investibleDispatch, ()=> {}, newInvestible);
              }
            }
          }
        }
        setOperationRunning(false);
        onSpinStop(`${formMarketManageLink(marketId)}#participation=true`);
      });
  }

  return (
    <>
      <DismissableText textId={'decisionAddHelp'} />
      <Card id="tourRoot">
        <CardType className={classes.cardType} type={DECISION_TYPE} />
        <CardContent className={classes.cardContent}>
          <Typography>
            {intl.formatMessage({ id: 'decisionAddExpirationLabel' }, { x: expiration_minutes / 1440 })}
          </Typography>
          <ExpirationSelector
            id="expires"
            value={expiration_minutes}
            className={classes.row}
            onChange={handleChange('expiration_minutes')}
          />
          <Typography>
            {intl.formatMessage({ id: 'allowMultiVote' })}
            <Checkbox
              id="multiVote"
              name="multiVote"
              checked={multiVote}
              onChange={toggleMultiVote}
            />
          </Typography>
          <TextField
            fullWidth
            id="decision-name"
            label={intl.formatMessage({ id: "agilePlanFormTitleLabel" })}
            onChange={handleChange('name')}
            placeholder={intl.formatMessage({
              id: "decisionTitlePlaceholder"
            })}
            value={name}
            variant="filled"
          />
          {Editor}
        </CardContent>
        <CardActions className={myClasses.actions}>
          <SpinningIconLabelButton onClick={handleCancel} doSpin={false} icon={Clear}>
            {intl.formatMessage({ id: 'marketAddCancelLabel' })}
          </SpinningIconLabelButton>
          <SpinningIconLabelButton onClick={handleSave} icon={SettingsBackupRestore}
                                   disabled={!createEnabled || !validForm}>
            {intl.formatMessage({ id: 'agilePlanFormSaveLabel' })}
          </SpinningIconLabelButton>
        </CardActions>
      </Card>
    </>
  );
}

DecisionAdd.propTypes = {
  onSpinStop: PropTypes.func,
  onSave: PropTypes.func,
  storedState: PropTypes.object.isRequired,
};

DecisionAdd.defaultProps = {
  onSave: () => {},
  onSpinStop: () => {
  },
};

export default DecisionAdd;
