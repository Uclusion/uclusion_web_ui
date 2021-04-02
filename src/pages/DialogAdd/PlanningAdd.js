import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import localforage from 'localforage'
import { createPlanning } from '../../api/markets'
import { processTextAndFilesForSave } from '../../api/files'
import { PLANNING_TYPE } from '../../constants/markets'
import { OperationInProgressContext } from '../../contexts/OperationInProgressContext/OperationInProgressContext'
import {  useLocation } from 'react-router'
import queryString from 'query-string'
import { Form } from '../../components/AgilePlan'
import { formMarketLink, formMarketManageLink } from '../../utils/marketIdPathFunctions'
import DismissableText from '../../components/Notifications/DismissableText'

function PlanningAdd(props) {

  const location = useLocation();
  const { hash } = location;
  const values = queryString.parse(hash);
  const { investibleId: parentInvestibleId, id: parentMarketId } = values;
  const { onSpinStop, storedState, onSave, createEnabled } = props;
  const {
    description: storedDescription,
    name: storedName,
    max_budget: storedBudget,
    investment_expiration: storedExpiration,
    votes_required: storedVotesRequired
  } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const emptyPlan = { name: storedName };
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [currentValues, setCurrentValues] = useState(emptyPlan);
  const [description, setDescription] = useState(storedDescription);
  const [investmentExpiration, setInvestmentExpiration] = useState(
    storedExpiration || 14
  );
  const [maxBudget, setMaxBudget] = useState(storedBudget);
  const [votesRequired, setVotesRequired] = useState(storedVotesRequired || 0);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const { name } = currentValues;

  function handleCancel() {
    onSpinStop();
  }
  const itemKey = `add_market_${PLANNING_TYPE}`;
  function handleDraftState(newDraftState) {
    setDraftState(newDraftState);
    localforage.setItem(itemKey, newDraftState);
  }

  function handleChange(field) {
    return event => {
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
    localforage.getItem(itemKey).then(stateFromDisk => {
      handleDraftState({ ...stateFromDisk, description });
    });
  }

  function onInvestmentExpirationChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    setInvestmentExpiration(valueInt);
    handleDraftState({ ...draftState, investment_expiration: valueInt });
  }

  function onMaxBudgetChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    setMaxBudget(valueInt);
    handleDraftState({ ...draftState, max_budget: valueInt });
  }

  function onVotesRequiredEstimateChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    setVotesRequired(valueInt);
    handleDraftState({ ...draftState, votes_required: valueInt });
  }

  function handleSave() {
    setOperationRunning(true);
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved
    } = processTextAndFilesForSave(uploadedFiles, description);
    const processedDescription = tokensRemoved ? tokensRemoved : ' ';
    const addInfo = {
      name,
      uploaded_files: filteredUploads,
      market_type: PLANNING_TYPE,
      description: processedDescription,
    };
    if (investmentExpiration != null) {
      addInfo.investment_expiration = investmentExpiration;
    }
    if (maxBudget != null) {
      addInfo.max_budget = maxBudget;
    }
    if (parentInvestibleId) {
      addInfo.parent_investible_id = parentInvestibleId;
    }
    if (parentMarketId) {
      addInfo.parent_market_id = parentMarketId;
    }
    if (votesRequired != null) {
      addInfo.votes_required = votesRequired;
    }
    return createPlanning(addInfo).then(result => {
      onSave(result);
      const {
        market: { id: marketId }
      } = result;
      setOperationRunning(false);
      onSpinStop(parentMarketId ? formMarketLink(marketId) : `${formMarketManageLink(marketId)}#participation=true`);
    });
  }
  return (
    <>
      <DismissableText textId={'planningAddHelp'} />
      <Form
        marketId=""
        description={description}
        onDescriptionChange={onEditorChange}
        investmentExpiration={investmentExpiration}
        onInvestmentExpirationChange={onInvestmentExpirationChange}
        maxBudget={maxBudget}
        onMaxBudgetChange={onMaxBudgetChange}
        name={name}
        onNameChange={handleChange("name")}
        onCancel={handleCancel}
        onSave={handleSave}
        onS3Upload={onS3Upload}
        onStorageChange={onStorageChange}
        setOperationRunning={setOperationRunning}
        votesRequired={votesRequired}
        onVotesRequiredChange={onVotesRequiredEstimateChange}
        createEnabled={createEnabled}
      />
    </>
  );
}

PlanningAdd.propTypes = {
  onSpinStop: PropTypes.func,
  onSave: PropTypes.func,
  storedState: PropTypes.object.isRequired
};

PlanningAdd.defaultProps = {
  onSpinStop: () => {},
  onSave: () => {}
};

export default PlanningAdd;
