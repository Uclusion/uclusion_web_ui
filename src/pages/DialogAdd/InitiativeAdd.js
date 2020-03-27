import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl'
import {
  Button, Card, CardActions, CardContent, TextField, Typography,
} from '@material-ui/core';
import localforage from 'localforage';
import QuillEditor from '../../components/TextEditors/QuillEditor';
import ExpirationSelector from '../../components/Expiration/ExpirationSelector';
import { createDecision } from '../../api/markets';
import { processTextAndFilesForSave } from '../../api/files';
import { INITIATIVE_TYPE } from '../../constants/markets'
import { addDecisionInvestible } from '../../api/investibles';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { DiffContext } from '../../contexts/DiffContext/DiffContext';
import { addInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { usePlanFormStyles } from '../../components/AgilePlan';
import CardType, { VOTING_TYPE } from '../../components/CardType'
import { formMarketManageLink } from '../../utils/marketIdPathFunctions'
import DismissableText from '../../components/Notifications/DismissableText'

function InitiativeAdd(props) {
  const intl = useIntl();
  const {
    onSpinStop, onSave, storedState,
  } = props;
  const { description: storedDescription, name: storedName, expiration_minutes: storedExpirationMinutes } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const classes = usePlanFormStyles();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const emptyMarket = { name: storedName, description: storedDescription,
    expiration_minutes: storedExpirationMinutes || 1440 };
  const [validForm, setValidForm] = useState(false);
  const [currentValues, setCurrentValues] = useState(emptyMarket);
  const [description, setDescription] = useState(storedDescription);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { name, expiration_minutes: expirationMinutes } = currentValues;

  useEffect(() => {
    // Long form to prevent flicker
    if (name && expirationMinutes > 0 && description && description.length > 0) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, description, expirationMinutes, validForm]);

  function handleCancel() {
    onSpinStop();
  }

  const itemKey = `add_market_${INITIATIVE_TYPE}`;
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
      name: 'NA',
      market_type: INITIATIVE_TYPE,
      description: 'NA',
      expiration_minutes: expirationMinutes,
    };
    return createDecision(addInfo, 'errorInitiativeAddFailed')
      .then((result) => {
        onSave(result);
        const { market: { id: marketId }} = result;
        const addInfo = {
          marketId,
          uploadedFiles: filteredUploads,
          description: tokensRemoved,
          name,
        };
        return addDecisionInvestible(addInfo).then((investible) => {
          addInvestible(invDispatch, diffDispatch, investible);
          return {
            result: `${formMarketManageLink(marketId)}#participation=true`,
            spinChecker: () => Promise.resolve(true),
          };
        });
      });
  }

  return (
    <>
      <DismissableText textId='initiativeAddHelp' />
      <Card>
        <CardType
          className={classes.cardType}
          label={`${intl.formatMessage({
            id: "initiativeInvestibleDescription"
          })}`}
          type={VOTING_TYPE}
        />
        <CardContent className={classes.cardContent}>
          <Typography
            className={classes.row}
          >
            {intl.formatMessage({ id: 'initiativeAddExpirationLabel' }, { x: expirationMinutes / 1440 })}
          </Typography>
          <ExpirationSelector
            value={expirationMinutes}
            className={classes.row}
            onChange={handleChange('expiration_minutes')}
          />
          <TextField
            fullWidth
            id="initiative-name"
            label={intl.formatMessage({ id: "agilePlanFormTitleLabel" })}
            onChange={handleChange('name')}
            placeholder={intl.formatMessage({
              id: "initiativeTitlePlaceholder"
            })}
            value={name}
            variant="filled"
          />
          <QuillEditor
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
            variant="contained"
            color="primary"
            onClick={handleSave}
            disabled={!validForm}
            onSpinStop={onSpinStop}
            hasSpinChecker
            id="save"
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

InitiativeAdd.propTypes = {
  onSpinStop: PropTypes.func,
  onSave: PropTypes.func,
  storedState: PropTypes.object.isRequired,
};

InitiativeAdd.defaultProps = {
  onSave: () => {},
  onSpinStop: () => {
  },
};

export default InitiativeAdd;
