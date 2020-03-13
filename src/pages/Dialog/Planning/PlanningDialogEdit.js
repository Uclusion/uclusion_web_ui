import React, { useContext, useState } from "react";
import PropTypes from "prop-types";
import { useIntl } from "react-intl";
import localforage from "localforage";
import { lockPlanningMarketForEdit, updateMarket } from "../../../api/markets";
import { processTextAndFilesForSave } from "../../../api/files";
import { OperationInProgressContext } from "../../../contexts/OperationInProgressContext/OperationInProgressContext";
import { Form } from "../../../components/AgilePlan";

function PlanningDialogEdit(props) {
  const { onSpinStop, onCancel, market, storedState } = props;
  const {
    id,
    name: initialMarketName,
    max_budget: initialBudget,
    investment_expiration: initialExpiration,
    days_estimate: initialDaysEstimate,
    votes_required: initialVotesRequired
  } = market;
  const {
    description: storedDescription,
    name: storedName,
    max_budget: storedBudget,
    investment_expiration: storedExpiration,
    days_estimate: storedDaysEstimate,
    votes_required: storedVotesRequired
  } = storedState;
  const intl = useIntl();
  const [mutableMarket, setMutableMarket] = useState({
    ...market,
    name: storedName || initialMarketName,
    max_budget: storedBudget || initialBudget,
    investment_expiration: storedExpiration || initialExpiration,
    days_estimate: storedDaysEstimate || initialDaysEstimate,
    votes_required: storedVotesRequired || initialVotesRequired
  });
  const [draftState, setDraftState] = useState(storedState);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const {
    name,
    max_budget,
    investment_expiration,
    days_estimate,
    votes_required
  } = mutableMarket;
  const [description, setDescription] = useState(
    storedDescription || mutableMarket.description
  );

  function handleChange(name) {
    return event => {
      const { value } = event.target;
      setMutableMarket({ ...mutableMarket, [name]: value });
      handleDraftState({ ...draftState, [name]: value });
    };
  }

  function handleDraftState(newDraftState) {
    setDraftState(newDraftState);
    localforage.setItem(id, newDraftState);
  }

  function handleSave() {
    // the set of files for the market is all the old files, plus our new ones
    const oldMarketUploadedFiles = market.uploaded_files || [];
    const newUploadedFiles = [...uploadedFiles, ...oldMarketUploadedFiles];
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved
    } = processTextAndFilesForSave(newUploadedFiles, description);
    const daysEstimateInt =
      days_estimate != null ? parseInt(days_estimate, 10) : null;
    const votesRequiredInt =
      votes_required != null ? parseInt(votes_required, 10) : null;
    return lockPlanningMarketForEdit(id, true)
      .then(() =>
        updateMarket(
          id,
          name,
          tokensRemoved,
          filteredUploads,
          parseInt(max_budget, 10),
          parseInt(investment_expiration, 10),
          daysEstimateInt,
          votesRequiredInt
        )
      )
      .then(market => {
        return {
          result: market,
          spinChecker: () => Promise.resolve(true)
        };
      });
  }

  function onEditorChange(content) {
    setDescription(content);
  }

  function onStorageChange(description) {
    localforage.getItem(id).then(stateFromDisk => {
      handleDraftState({ ...stateFromDisk, description });
    });
  }

  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  return (
    <Form
      marketId={id}
      daysEstimate={days_estimate}
      onDaysEstimate={handleChange("days_estimate")}
      description={description}
      onDescriptionChange={onEditorChange}
      investmentExpiration={investment_expiration}
      onInvestmentExpirationChange={handleChange("investment_expiration")}
      maxBudget={max_budget}
      onMaxBudgetChange={handleChange("max_budget")}
      name={name}
      onNameChange={handleChange("name")}
      onS3Upload={onS3Upload}
      onSpinStop={onSpinStop}
      onStorageChange={onStorageChange}
      setOperationRunning={setOperationRunning}
      votesRequired={votes_required}
      onVotesRequiredChange={handleChange("votes_required")}
      /* actions */
      cancelLabel={intl.formatMessage({ id: "marketEditCancelLabel" })}
      saveLab
      onCancel={onCancel}
      onSave={handleSave}
    />
  );
}

PlanningDialogEdit.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  onSpinStop: PropTypes.func,
  onCancel: PropTypes.func,
  storedState: PropTypes.object.isRequired
};

PlanningDialogEdit.defaultProps = {
  onCancel: () => {},
  onSpinStop: () => {}
};

export default PlanningDialogEdit;
