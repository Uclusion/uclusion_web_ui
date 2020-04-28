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
import { DECISION_TYPE, PLANNING_TYPE } from '../../constants/markets'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import UclusionTour from '../../components/Tours/UclusionTour'
import {
  PURE_SIGNUP_ADD_DIALOG,
  PURE_SIGNUP_ADD_DIALOG_STEPS,
  PURE_SIGNUP_FAMILY_NAME
} from '../../components/Tours/pureSignupTours'
import { useHistory } from 'react-router'
import queryString from 'query-string'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketDetailsForType } from '../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { addParticipants } from '../../api/users'
import CardType from '../../components/CardType'
import { usePlanFormStyles } from '../../components/AgilePlan'
import { formMarketAddInvestibleLink } from '../../utils/marketIdPathFunctions'
import DismissableText from '../../components/Notifications/DismissableText'

function DecisionAdd(props) {
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { hash } = location;
  const values = queryString.parse(hash);
  const { investibleId: parentInvestibleId, id: parentMarketId } = values;
  const {
    onSpinStop, storedState, onSave, createEnabled, billingDismissText
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
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [marketState] = useContext(MarketsContext);
  const [multiVote, setMultiVote] = useState(false);

  function toggleMultiVote() {
    setMultiVote(!multiVote);
  }

  useEffect(() => {
    // Long form to prevent flicker
    if (name && expiration_minutes > 0 && description && description.length > 0) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, description, expiration_minutes, validForm]);

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
    const addInfo = {
      name,
      uploaded_files: filteredUploads,
      market_type: DECISION_TYPE,
      description: tokensRemoved,
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
        turnOffSpin.result = formMarketAddInvestibleLink(marketId);
        if (parentMarketId) {
          const planningMarkets = getMarketDetailsForType(marketState, marketPresencesState, PLANNING_TYPE);
          const marketDetails = planningMarkets.find((planningMarket) => planningMarket.id === parentMarketId);
          if (marketDetails) {
            const marketPresences = getMarketPresences(marketPresencesState, parentMarketId);
            const others = marketPresences.filter((presence) => !presence.current_user && !presence.market_banned)
            if (others) {
              const participants = others.map((presence) => {
                return {
                  user_id: presence.id,
                  account_id: presence.account_id,
                  is_observer: !presence.following
                };
              });
              return addParticipants(marketId, participants).then(() => turnOffSpin);
            }
          }
        }
        return turnOffSpin;
      });
  }

  return (
    <>
      <DismissableText textId={createEnabled ? 'decisionAddHelp' : billingDismissText} />
      <Card id="tourRoot">
        <UclusionTour
          name={PURE_SIGNUP_ADD_DIALOG}
          family={PURE_SIGNUP_FAMILY_NAME}
          steps={PURE_SIGNUP_ADD_DIALOG_STEPS}
          hideBackButton
        />
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
