import React, { useContext, useEffect, useState, } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage, useIntl } from 'react-intl'
import { Button, Card, CardActions, CardContent, Checkbox, TextField, Typography, } from '@material-ui/core'
import localforage from 'localforage'
import QuillEditor from '../../components/TextEditors/QuillEditor'
import ExpirationSelector from '../../components/Expiration/ExpirationSelector'
import { createDecision } from '../../api/markets'
import { processTextAndFilesForSave } from '../../api/files'
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'
import { DECISION_TYPE } from '../../constants/markets'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useLocation } from 'react-router'
import queryString from 'query-string'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import CardType from '../../components/CardType'
import { usePlanFormStyles } from '../../components/AgilePlan'
import { formMarketManageLink, urlHelperGetName } from '../../utils/marketIdPathFunctions'
import DismissableText from '../../components/Notifications/DismissableText'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getRequiredInputStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import _ from 'lodash'
import { addInvestible, getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'

function DecisionAdd(props) {
  const intl = useIntl();
  const location = useLocation();
  const { hash } = location;
  const values = queryString.parse(hash);
  const { investibleId: parentInvestibleId, id: parentMarketId } = values;
  const {
    onSpinStop, storedState, onSave, createEnabled
  } = props;
  const { description: storedDescription, name: storedName, expiration_minutes: storedExpirationMinutes } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const classes = usePlanFormStyles();
  const emptyMarket = { name: storedName, expiration_minutes: storedExpirationMinutes || 1440 };
  const [validForm, setValidForm] = useState(false);
  const [currentValues, setCurrentValues] = useState(emptyMarket);
  const [description, setDescription] = useState(storedDescription);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { name, expiration_minutes } = currentValues;
  const [marketState] = useContext(MarketsContext);
  const [investibleState, investibleDispatch] = useContext(InvestiblesContext);
  const [multiVote, setMultiVote] = useState(false);
  const [marketStagesState] = useContext(MarketStagesContext);

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

  function onEditorChange(description) {
    setDescription(description);
  }

  function onStorageChange(description) {
    localforage.getItem(itemKey).then((stateFromDisk) => {
      handleDraftState({ ...stateFromDisk, description });
    });
  }

  function handleSave() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, description);
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
    const turnOffSpin = {
      spinChecker: () => {
        return Promise.resolve(true);
      },
    };
    return createDecision(addInfo)
      .then((result) => {
        const { market } = result;
        onSave(result);
        const { id: marketId } = market;
        turnOffSpin.result = `${formMarketManageLink(marketId)}#participation=true`;
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
        return turnOffSpin;
      });
  }

  return (
    <>
      <DismissableText textId={'decisionAddHelp'} />
      <Card elevation={0} id="tourRoot">
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
          <QuillEditor
            id="description"
            onS3Upload={onS3Upload}
            onChange={onEditorChange}
            onStoreChange={onStorageChange}
            placeholder={intl.formatMessage({ id: 'marketAddDescriptionDefault' })}
            defaultValue={description}
            setOperationInProgress={setOperationRunning}
            getUrlName={urlHelperGetName(marketState, investibleState)}
          />
        </CardContent>
        <CardActions className={classes.actions}>
          <Button
            onClick={handleCancel}
            className={classes.actionSecondary}
            color="secondary"
            variant="contained">
            <FormattedMessage
              id="marketAddCancelLabel"
            />
          </Button>
          <SpinBlockingButton
            marketId=""
            id="save"
            variant="contained"
            color="primary"
            onClick={handleSave}
            hasSpinChecker
            disabled={!createEnabled || !validForm}
            onSpinStop={onSpinStop}
            className={classes.actionPrimary}
          >
            <FormattedMessage
              id="agilePlanFormSaveLabel"
            />
          </SpinBlockingButton>
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
