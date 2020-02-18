import React from "react";
import PropTypes from "prop-types";
import { FormattedMessage, useIntl } from "react-intl";
import {
  Card,
  CardActions,
  CardContent,
  Divider,
  makeStyles,
  TextField,
  darken
} from "@material-ui/core";
import { KeyboardDatePicker } from "@material-ui/pickers";
import localforage from "localforage";
import QuillEditor from "../../components/TextEditors/QuillEditor";
import { createPlanning } from "../../api/markets";
import { processTextAndFilesForSave } from "../../api/files";
import { PLANNING_TYPE } from "../../constants/markets";
import SpinBlockingButton from "../../components/SpinBlocking/SpinBlockingButton";
import { OperationInProgressContext } from "../../contexts/OperationInProgressContext/OperationInProgressContext";
import CardType, { AGILE_PLAN_TYPE } from "../../components/CardType";
import clsx from "clsx";

const noop = () => {};

const PlanContext = React.createContext(
  Object.defineProperties(
    {},
    {
      plan: {
        get() {
          throw new TypeError("missing PlanContext.Provider");
        }
      },
      dispatch: {
        get() {
          throw new TypeError("missing PlanContext.Provider");
        }
      }
    }
  )
);

const usePlanningAddStyles = makeStyles(
  theme => {
    return {
      cardType: {
        display: "inline-flex",
        alignSelf: "flex-start"
      },
      actions: {
        justifyContent: "flex-end"
      },
      action: {
        textTransform: "capitalize"
      },
      actionCancel: {
        backgroundColor: "#BDBDBD",
        color: "black",
        "&:hover": {
          backgroundColor: darken("#BDBDBD", 0.04)
        },
        "&:focus": {
          backgroundColor: darken("#BDBDBD", 0.12)
        }
      },
      actionSubmit: {
        backgroundColor: "#2D9CDB",
        color: "white",
        "&:hover": {
          backgroundColor: darken("#2D9CDB", 0.04)
        },
        "&:focus": {
          backgroundColor: darken("#2D9CDB", 0.12)
        }
      }
    };
  },
  { name: "PlanningAdd" }
);

function PlanningAdd(props) {
  const {
    onSpinStop: handleSpinStop = noop,
    storedDescription,
    onSave = noop
  } = props;

  const [plan, dispatch] = React.useReducer(
    (state, action) => {
      const nextState = { ...state };
      switch (action.type) {
        case "CHANGE_NAME":
          nextState.name = action.payload;
          break;
        case "CHANGE_DESCRIPTION":
          nextState.description = action.payload;
          break;
        case "CHANGE_FILES":
          nextState.files = action.payload;
          break;
        case "ZERO_CURRENT_VALUES":
          nextState.description = "";
          nextState.name = "";
          break;
        case "CHANGE_INVESTMENT_EXPIRATION":
          nextState.investmentExpiration = action.payload;
          break;
        case "CHANGE_MAX_BUDGET":
          nextState.maxBudget = action.payload;
          break;
        case "CHANGE_DAYS_ESTIMATE":
          nextState.daysEstimate = action.payload;
          break;
        default:
          throw new TypeError(`unknown action '${action.type}'`);
      }

      nextState.valid =
        nextState.name.length > 0 && nextState.description.length > 0;

      return nextState;
    },
    {
      name: "",
      /**
       * @type {Date | undefined}
       */
      daysEstimate: undefined,
      description: storedDescription,
      files: [],
      investmentExpiration: 14,
      maxBudget: 14,
      valid: false
    }
  );

  function zeroCurrentValues() {
    dispatch({ type: "ZERO_CURRENT_VALUES", payload: "" });
  }

  function handleCancel() {
    zeroCurrentValues();
    handleSpinStop();
  }

  function handleSave() {
    const {
      daysEstimate,
      description,
      files: uploadedFiles,
      investmentExpiration,
      maxBudget,
      name
    } = plan;
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
    if (investmentExpiration) {
      addInfo.investment_expiration = investmentExpiration;
    }
    if (maxBudget) {
      addInfo.max_budget = maxBudget;
    }
    if (daysEstimate) {
      addInfo.days_estimate = daysEstimate;
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

  const planContextValue = React.useMemo(() => ({ plan, dispatch }), [
    plan,
    dispatch
  ]);

  const classes = usePlanningAddStyles();

  return (
    <PlanContext.Provider value={planContextValue}>
      <Card>
        <CardType className={classes.cardType} type={AGILE_PLAN_TYPE} />
        <CardContent>
          <Content />
        </CardContent>
        <CardActions className={classes.actions}>
          <SpinBlockingButton
            className={clsx(classes.action, classes.actionCancel)}
            color="secondary"
            marketId=""
            onClick={handleCancel}
            variant="contained"
          >
            <FormattedMessage id="marketAddCancelLabel" />
          </SpinBlockingButton>
          <SpinBlockingButton
            marketId=""
            variant="contained"
            className={clsx(classes.action, classes.actionSubmit)}
            color="primary"
            onClick={handleSave}
            disabled={!plan.valid}
            onSpinStop={handleSpinStop}
          >
            <FormattedMessage id="marketAddSaveLabel" />
          </SpinBlockingButton>
        </CardActions>
      </Card>
    </PlanContext.Provider>
  );
}

PlanningAdd.propTypes = {
  onSpinStop: PropTypes.func,
  onSave: PropTypes.func,
  storedDescription: PropTypes.string.isRequired
};

const useContentStyles = makeStyles(
  theme => ({
    root: {
      padding: theme.spacing(2)
    },
    divider: {
      margin: theme.spacing(2, 0)
    },
    fieldsetRequired: {
      border: "none",
      borderRight: `1px solid ${theme.palette.grey[400]}`,
      display: "inline",
      "& legend": {
        // Figma sketches have those as red but this is already used as an
        // error color
        // color: "red"
      },
      "& $input": {
        marginRight: theme.spacing(2)
      }
    },
    fieldsetOptional: {
      border: "none",
      display: "inline",
      "& legend": {}
    },
    input: {
      margin: 0
    },
    label: {
      fontWeight: "bold",
      textTransform: "capitalize",
      "&.Mui-focused": {
        color: "initial"
      }
    }
  }),
  { name: "Content" }
);

function Content(props) {
  const classes = useContentStyles();

  const { plan, dispatch } = React.useContext(PlanContext);

  function handleNameChange(event) {
    dispatch({ type: "CHANGE_NAME", payload: event.target.value });
  }

  /** This might not work if the newUploads it sees is always old * */
  function onS3Upload(metadatas) {
    dispatch({ type: "CHANGE_FILES", payload: metadatas });
  }
  const [, setOperationRunning] = React.useContext(OperationInProgressContext);

  function handleEditorChange(description) {
    dispatch({ type: "CHANGE_DESCRIPTION", payload: description });
  }
  function handleStorageChange(description) {
    localforage.setItem(`add_market_${PLANNING_TYPE}`, description);
  }

  function handleInvestmentExpirationChange(event) {
    const { value } = event.target;
    dispatch({
      type: "CHANGE_INVESTMENT_EXPIRATION",
      payload: parseInt(value, 10)
    });
  }

  function handleMaxBudgetChange(event) {
    const { value } = event.target;
    dispatch({ type: "CHANGE_MAX_BUDGET", payload: parseInt(value, 10) });
  }

  function handleDaysEstimateChange(date) {
    dispatch({ type: "CHANGE_DAYS_ESTIMATE", payload: date });
  }

  const intl = useIntl();

  return (
    <React.Fragment>
      <TextField
        inputProps={{
          maxLength: 255
        }}
        id="plan-name"
        label={<FormattedMessage id="marketAddTitleLabel" />}
        InputLabelProps={{ className: classes.label, shrink: true }}
        placeholder={intl.formatMessage({ id: "marketAddTitlePlaceholder" })}
        margin="normal"
        fullWidth
        variant="filled"
        value={plan.name}
        onChange={handleNameChange}
      />
      <QuillEditor
        onS3Upload={onS3Upload}
        onChange={handleEditorChange}
        onStoreChange={handleStorageChange}
        placeHolder={intl.formatMessage({
          id: "marketAddDescriptionPlaceholder"
        })}
        defaultValue={plan.description}
        setOperationInProgress={setOperationRunning}
      />
      <Divider className={classes.divider} />
      <fieldset className={classes.fieldsetRequired}>
        <legend>
          <FormattedMessage id="marketAddFieldsetLabelRequired" />
        </legend>
        <TextField
          className={classes.input}
          id="plan-max-budget"
          type="number"
          variant="filled"
          label={<FormattedMessage id="maxMaxBudgetInputLabel" />}
          InputLabelProps={{ className: classes.label }}
          value={plan.maxBudget}
          onChange={handleMaxBudgetChange}
        />
        <TextField
          className={classes.input}
          id="plan-expiration"
          type="number"
          variant="filled"
          label={<FormattedMessage id="investmentExpirationInputLabel" />}
          InputLabelProps={{ className: classes.label }}
          value={plan.investmentExpiration}
          onChange={handleInvestmentExpirationChange}
        />
      </fieldset>
      <fieldset className={classes.fieldsetOptional}>
        <legend>
          <FormattedMessage id="marketAddFieldsetLabelOptional" />
        </legend>
        <KeyboardDatePicker
          className={classes.input}
          disableToolbar
          format="MM/dd/yyyy"
          id="plan-days-estimate"
          InputLabelProps={{
            className: classes.label
          }}
          inputVariant="filled"
          KeyboardButtonProps={{
            "aria-label": "change date"
          }}
          label={<FormattedMessage id="daysEstimateInputLabel" />}
          margin="normal"
          onChange={handleDaysEstimateChange}
          placeholder={intl.formatMessage({
            id: "marketAddDaysEstimatePlaceholder"
          })}
          value={plan.daysEstimate}
          variant="inline"
        />
      </fieldset>
    </React.Fragment>
  );
}

export default PlanningAdd;
