import React, { useContext, useEffect, useState } from "react";
import PropTypes from "prop-types";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Button,
  Card,
  CardActions,
  CardContent,
  makeStyles,
  TextField,
  InputAdornment,
  darken
} from "@material-ui/core";
import { addDays, differenceInCalendarDays } from "date-fns";
import localforage from "localforage";
import QuillEditor from "../../components/TextEditors/QuillEditor";
import { createPlanning } from "../../api/markets";
import { processTextAndFilesForSave } from "../../api/files";
import { PLANNING_TYPE } from "../../constants/markets";
import SpinBlockingButton from "../../components/SpinBlocking/SpinBlockingButton";
import { OperationInProgressContext } from "../../contexts/OperationInProgressContext/OperationInProgressContext";
import { useHistory } from "react-router";
import queryString from "query-string";
import CardType, { AGILE_PLAN_TYPE } from "../../components/CardType";
import {
  IdealDelivery,
  MaxBudget,
  VoteExpiration,
  Votes
} from "../../components/AgilePlan";
import clsx from "clsx";

const useStyles = makeStyles(
  theme => ({
    adornmentSuffix: {},
    cardContent: {
      display: "flex",
      flexWrap: "wrap",
      padding: theme.spacing(6),
      "& > *": {
        "flex-grow": 1,
        margin: theme.spacing(1, 0),
        "&:first-child": {
          marginTop: 0
        },
        "&:last-child": {
          marginBottom: 0
        }
      }
    },
    cardType: {
      display: "inline-flex"
    },
    fieldset: {
      border: "none",
      display: "inline-block",
      margin: 0,
      padding: 0,
      "& > legend": {},
      "& > *:not(legend)": {
        margin: theme.spacing(1)
      }
    },
    fieldsetRequired: {
      "& > legend": {
        color: "red" // TODO
      }
    },
    actions: {
      margin: theme.spacing(1, 0, 0, 0)
    },
    actionPrimary: {
      backgroundColor: "#2D9CDB",
      color: "black",
      "&:hover": {
        backgroundColor: darken("#2D9CDB", 0.04)
      },
      "&:focus": {
        backgroundColor: darken("#2D9CDB", 0.12)
      }
    },
    actionSecondary: {
      backgroundColor: "#BDBDBD",
      color: "black",
      "&:hover": {
        backgroundColor: darken("#BDBDBD", 0.04)
      },
      "&:focus": {
        backgroundColor: darken("#BDBDBD", 0.12)
      }
    }
  }),
  { name: "PlanningAdd" }
);

function PlanningAdd(props) {
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { hash } = location;
  const values = queryString.parse(hash);
  const { investibleId: parentInvestibleId, id: parentMarketId } = values;
  const { onSpinStop, storedState, onSave } = props;
  const {
    description: storedDescription,
    name: storedName,
    max_budget: storedBudget,
    investment_expiration: storedExpiration,
    days_estimate: storedDaysEstimate,
    votes_required: storedVotesRequired
  } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const classes = useStyles();
  const emptyPlan = { name: storedName };
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [currentValues, setCurrentValues] = useState(emptyPlan);
  const [validForm, setValidForm] = useState(false);
  const [description, setDescription] = useState(storedDescription);
  const [investmentExpiration, setInvestmentExpiration] = useState(
    storedExpiration || 14
  );
  const [maxBudget, setMaxBudget] = useState(storedBudget || 14);
  const [idealDelivery, setDaysEstimate] = useState(
    typeof storedDaysEstimate === "number"
      ? addDays(new Date(), storedDaysEstimate)
      : null
  );
  const [votesRequired, setVotesRequired] = useState(storedVotesRequired);
  const [uploadedFiles, setUploadedFiles] = useState([]);
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

  function onIdealDeliveryChange(date) {
    setDaysEstimate(date);
    handleDraftState({
      ...draftState,
      days_estimate:
        date !== null ? differenceInCalendarDays(date, new Date()) : null
    });
  }

  function onVotesRequiredEstimateChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    setVotesRequired(valueInt);
    handleDraftState({ ...draftState, votes_required: valueInt });
  }

  function handleSave() {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved
    } = processTextAndFilesForSave(uploadedFiles, description);
    const addInfo = {
      name,
      uploaded_files: filteredUploads,
      market_type: PLANNING_TYPE,
      description: tokensRemoved
    };
    if (investmentExpiration != null) {
      addInfo.investment_expiration = investmentExpiration;
    }
    if (maxBudget != null) {
      addInfo.max_budget = maxBudget;
    }
    if (idealDelivery != null) {
      addInfo.days_estimate = differenceInCalendarDays(
        idealDelivery,
        new Date()
      );
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
      return {
        result: marketId,
        spinChecker: () => Promise.resolve(true)
      };
    });
  }

  // TODO remove
  console.debug(
    "estimate: ",
    idealDelivery && differenceInCalendarDays(idealDelivery, new Date())
  );

  return (
    <Card>
      <CardType className={classes.cardType} type={AGILE_PLAN_TYPE} />
      <CardContent className={classes.cardContent}>
        <TextField
          fullWidth
          id="agile-plan-name"
          label={intl.formatMessage({ id: "agilePlanAddTitleLabel" })}
          onChange={handleChange("name")}
          placeholder={intl.formatMessage({
            id: "agilePlanAddTitlePlaceholder"
          })}
          startAdornment={<InputAdornment>TODO Edit icon</InputAdornment>}
          value={name}
          variant="filled"
        />
        <QuillEditor
          onS3Upload={onS3Upload}
          onChange={onEditorChange}
          onStoreChange={onStorageChange}
          placeHolder={intl.formatMessage({
            id: "descriptionEdit"
          })}
          defaultValue={description}
          setOperationInProgress={setOperationRunning}
        />
        <fieldset className={clsx(classes.fieldset, classes.fieldsetRequired)}>
          <legend>Required</legend>
          <MaxBudget onChange={onMaxBudgetChange} value={maxBudget} />
          <VoteExpiration
            onChange={onInvestmentExpirationChange}
            value={investmentExpiration}
          />
          <Votes
            onChange={onVotesRequiredEstimateChange}
            value={votesRequired}
          />
        </fieldset>
        <fieldset className={classes.fieldset}>
          <legend>optional</legend>
          <IdealDelivery
            onChange={onIdealDeliveryChange}
            value={idealDelivery}
          />
        </fieldset>
      </CardContent>
      <CardActions className={classes.action}>
        <Button
          className={classes.actionSecondary}
          color="secondary"
          onClick={handleCancel}
          variant="contained"
        >
          <FormattedMessage id="marketAddCancelLabel" />
        </Button>
        <SpinBlockingButton
          className={classes.actionPrimary}
          color="primary"
          disabled={!validForm}
          marketId=""
          onClick={handleSave}
          onSpinStop={onSpinStop}
          variant="contained"
        >
          <FormattedMessage id="agilePlanAddSaveLabel" />
        </SpinBlockingButton>
      </CardActions>
    </Card>
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
