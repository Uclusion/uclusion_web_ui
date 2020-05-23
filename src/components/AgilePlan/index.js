import * as React from 'react'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import Grid from '@material-ui/core/Grid'
import ExpansionPanel from '@material-ui/core/ExpansionPanel'
import ExpansionPanelDetails from '@material-ui/core/ExpansionPanelDetails'
import ExpansionPanelSummary from '@material-ui/core/ExpansionPanelSummary'
import { darken, makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField';
import { FormattedMessage, useIntl } from 'react-intl';
import ExpandMoreIcon from '@material-ui/icons/ExpandMore';
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'
import CardType, { AGILE_PLAN_TYPE } from '../../components/CardType'
import QuillEditor from '../../components/TextEditors/QuillEditor'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import moment from 'moment'
import { Typography } from '@material-ui/core'
import clsx from 'clsx'

export const usePlanFormStyles = makeStyles(
  theme => ({
    cardContent: {
      display: "flex",
      flexWrap: "wrap",
      padding: theme.spacing(6),
      paddingTop: theme.spacing(3),
      "& > *": {
        "flex-grow": 1,
        margin: theme.spacing(1, 0),
        "&:first-child": {
          marginTop: 0
        },
        "&:last-child": {
          marginBottom: 0
        }
      },
      '& > ul': {
        flex: 4
      },
      [theme.breakpoints.down('sm')]: {
        padding: '16px'
      },

    },
    cardType: {
      display: "inline-flex"
    },
    cardTitle: {
      fontWeight: '700',
      fontSize: '1.2rem',
      padding: '15px 48px 0 48px'
    },
    noPadding: {
      padding: '0'
    },
    daysEstimation: {
      fontWeight:'700',
      fontSize: '.7rem'
    },
    fieldset: {
      border: "none",
      display: "inline-block",
      margin: 50,
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
      color: "white",
      textTransform: 'none',
      fontWeight: '700',
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
      textTransform: 'none',
      fontWeight: '700',
      "&:hover": {
        backgroundColor: darken("#BDBDBD", 0.04)
      },
      "&:focus": {
        backgroundColor: darken("#BDBDBD", 0.12)
      }
    },
    form: {
      width: '100%',
      marginTop: theme.spacing(3),
    },
    name: {
      width: '50%',
    },
    spacer: {
      flex: 1
    },
    search: {
      width: '100%',
      '& > div': {
        padding: '10px',
        '&:hover:not(.Mui-disabled):before': {
          borderBottom: '2px solid rgba(0, 0, 0, 0.27)'
        },
        '&:before': {
          borderBottom: '1px solid rgba(0, 0, 0, 0.2)'
        }
      }
    },
    searchContainer: {
      position: 'sticky'
    },
    sharedForm: {
      width: '20%',
      marginRight: 10,
    },
    sectionHeader: {
      fontWeight: 700,
    },
    scrollContainer: {
      overflowY: 'scroll',
      height: 'calc(350px - (4rem + 20px))'
    },
    scrollableList: {
      height: 350,
      overflowY: 'hidden',
      border: '1px solid #cfcfcf',
      borderRadius: 8,
      marginBottom: 15 
    },
    input: {
      backgroundColor: '#ecf0f1',
      border: 0,
      borderRadius: 8,
      padding: '4px',
      '& > div': {
        marginTop: 14
      },
      '& > div:before': {
        borderBottom: 0
      },
      '& > div:after': {
        borderBottom: 0
      },
      '& > label': {
        marginLeft: 10,
      },
      '& > label.Mui-focused': {
        color: 'black'
      },
      '& > label:not(.MuiInputLabel-shrink)': {
        transform: 'translate(0, 18px) scale(1)'
      },
      '& > div:hover:not(.Mui-disabled):before': {
        borderBottom: 0
      },
      '& > div:active:not(.Mui-disabled):before': {
        borderBottom: 0
      },
    },
    doneButton: {
      marginLeft: 50,
      marginBottom: 50,
    },
    selected: {
      backgroundColor: '#ecf0f1',
    },
    rightAlign: {
      flexDirection:'row-reverse'
    },
    unselected: {
      borderRadius: '6px',
      margin: '0 10px 0 5px',
      width: 'calc(100% - 15px)',
      height: '4rem'
    },
    flex: {
      display: 'flex',
      margin: 0,
      flexDirection: 'row'
    },
    advancedLink: {
      textDecoration: 'underline',
      color: '#545454',
      margin: '5px',
      cursor: 'pointer',
      width: 'auto'
    },
    fullWidth: {
      width: '100%'
    },
    requiredContainer: {
      position: 'relative',
      top: '16px'
    },
    helperText: {
      fontSize: '12px',
    },
    fieldsetContainer: {
      '& > div': {
        display: 'flex'
      },
    [theme.breakpoints.down('sm')]: {
      '& label':{
        display: 'none'
      }
    },
    },
    justifySpace: {
      justifyContent: 'space-between'
    },
    datePicker: {
      font: 'inherit',
      color: 'currentColor',
      width: '100%',
      border: 0,
      height: '1.1876em',
      margin: 0,
      display: 'block',
      padding: '6px 0 7px',
      minWidth: 0,
      boxSizing: 'content-box',
      animationName: 'mui-auto-fill-cancel',
      textAlign: 'center',
      '&:focus' : {
        outline: 'none'
      }
    },
    datePickerContainer: {
      width: '100%',
      '& > label' : {
        display: 'block'
      },
      '& > div': {
        marginTop: 0
      }
    },
    optional: {
      fontWeight: 100,
      marginBottom: '15px',
    },
    flexColumn: {
      flexDirection: 'column'
    },
    overflowVisible: {
      overflow: 'visible'
    }
  }),
  { name: "PlanningAdd" }
);

export function Form(props) {
  const classes = usePlanFormStyles();
  const intl = useIntl();

  const {
    daysEstimate,
    createdAt,
    onDaysEstimate,
    description,
    onDescriptionChange,
    investmentExpiration,
    onInvestmentExpirationChange,
    marketId,
    maxBudget,
    onMaxBudgetChange,
    name,
    onNameChange,
    onCancel,
    onSave,
    onS3Upload,
    onSpinStop,
    onStorageChange,
    setOperationRunning,
    votesRequired,
    onVotesRequiredChange,
    createEnabled,
  } = props;
  const [viewAdvanced, setViewAdvanced] = React.useState(false);
  const [validForm, setValidForm] = React.useState(true);
  React.useEffect(() => {
    // Long form to prevent flicker
    if (
      name &&
      parseInt(investmentExpiration, 10) > 0 &&
      parseInt(maxBudget, 10) > 0 &&
      description &&
      description.length > 0
    ) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, description, validForm, investmentExpiration, maxBudget]);

  const isCreateForm = marketId === "";
  return (
    <Card className={classes.overflowVisible}>
      <CardType className={classes.cardType} type={AGILE_PLAN_TYPE} />
      <CardContent className={classes.cardContent}>
        <TextField
          fullWidth
          id="agile-plan-name"
          label={intl.formatMessage({ id: "agilePlanFormTitleLabel" })}
          onChange={onNameChange}
          placeholder={intl.formatMessage({
            id: "agilePlanFormTitlePlaceholder"
          })}
          value={name}
          variant="filled"
        />
        <QuillEditor
          onS3Upload={onS3Upload}
          marketId={marketId}
          onChange={onDescriptionChange}
          onStoreChange={onStorageChange}
          placeholder={intl.formatMessage({
            id: "descriptionEdit"
          })}
          defaultValue={description}
          className={classes.fullWidth}
          setOperationInProgress={setOperationRunning}
        />
        <ExpansionPanel expanded={viewAdvanced}>
            <ExpansionPanelSummary
              onClick={() => {setViewAdvanced(!viewAdvanced)}}
              expandIcon={<ExpandMoreIcon />}
            >
              <span className={classes.advancedLink}>{intl.formatMessage({ id: "advanced" })}</span>
            </ExpansionPanelSummary>
            <ExpansionPanelDetails className={classes.flexColumn}>
              <legend className={classes.optional}>*{intl.formatMessage({ id: "optionalEdit" })}</legend>
              <Grid container className={clsx(classes.fieldset, classes.flex, classes.justifySpace)}>
                <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
                  <MaxBudget onChange={onMaxBudgetChange} value={maxBudget} />
                </Grid>
                <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
                  <VoteExpiration
                    onChange={onInvestmentExpirationChange}
                    value={investmentExpiration}
                  />
                </Grid>
                <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
                  <Votes onChange={onVotesRequiredChange} value={votesRequired} />
                </Grid>
                <Grid item md={5} xs={12} className={classes.fieldsetContainer}>
                  <DaysEstimate showLabel={ window.outerWidth < 600 ? false : true  } onChange={onDaysEstimate} value={daysEstimate} createdAt={createdAt} />
                </Grid>
              </Grid>
            </ExpansionPanelDetails>
        </ExpansionPanel>
      </CardContent>
      <CardActions className={classes.actions}>
        <Button
          className={classes.actionSecondary}
          color="secondary"
          onClick={onCancel}
          variant="contained"
        >
          <FormattedMessage
            id={isCreateForm ? "marketAddCancelLabel" : "marketAddCancelLabel"}
          />
        </Button>
        <SpinBlockingButton
          className={classes.actionPrimary}
          color="primary"
          disabled={(isCreateForm && !createEnabled) || !validForm}
          marketId={marketId}
          onClick={onSave}
          hasSpinChecker
          onSpinStop={onSpinStop}
          variant="contained"
        >
          <FormattedMessage
            id={isCreateForm ? "agilePlanFormSaveLabel" : "marketEditSaveLabel"}
          />
        </SpinBlockingButton>
      </CardActions>
    </Card>
  );
}

const useSuffixedInput = makeStyles(
  { input: { textAlign: "center", padding: '10px' } },
  { name: "SuffixedInput" }
);

export function MaxBudget(props) {
  const { readOnly, ...other } = props;
  const intl = useIntl();

  const classes = useSuffixedInput();
  const formClasses = usePlanFormStyles();

  return (
    <React.Fragment>
      <TextField
        id="agile-plan-max-budget"
        className={formClasses.input}
        inputProps={{
          className: classes.input,
          inputMode: "numeric",
          pattern: "[0-9]*"
        }}
        label={intl.formatMessage({
          id: "maxMaxBudgetInputLabel"
        })}
        placeholder="14"
        {...other}
      />
      <Typography>
        {intl.formatMessage({ id: "maxBudgetHelp" })}
      </Typography>
    </React.Fragment>
  );
}
export function VoteExpiration(props) {
  const { readOnly, ...other } = props;
  const intl = useIntl();

  const classes = useSuffixedInput();
  const formClasses = usePlanFormStyles();

  return (

    <React.Fragment>
      <TextField
        className={formClasses.input}
        id="agile-plan-expiration"
        inputProps={{
          className: classes.input,
          inputMode: "numeric",
          pattern: "[0-9]*"
        }}
        label={intl.formatMessage({
          id: "agilePlanFormInvestmentExpirationLabel"
        })}
        {...other}
      />
      <Typography>
        {intl.formatMessage({ id: "voteExpirationHelp" })}
      </Typography>
    </React.Fragment>
  );
}

export function Votes(props) {
  const { readOnly, ...other } = props;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const inputClasses = useInputSuffixStyles();

  return (
    <React.Fragment>
      <TextField
        className={classes.input}
        id="agile-plan-votes-required"
        InputProps={{ readOnly }}
        inputProps={{
          className: inputClasses.input,
          inputMode: "numeric",
          pattern: "[0-9]*",
          style: {textAlign: 'center'}
        }}
        label={intl.formatMessage({ id: "votesRequiredInputLabelShort" })}
        {...other}
      />
      <Typography>
        {intl.formatMessage({ id: "votesRequiredHelp" })}
      </Typography>
    </React.Fragment>
  );
}

export function DaysEstimate(props) {
  const { readOnly, value, onChange, createdAt, showLabel = true, showHelper = true } = props;

  const classes = usePlanFormStyles();
  const intl = useIntl();
  function getStartDate() {
    if (value && createdAt) {
      return moment(createdAt).add(value, 'days').toDate();
    }
    return undefined;
  }
  
  function handleDateChange(date) {
    const usedDate = createdAt ? createdAt : new Date();
    const myValue = moment(date).diff(moment(usedDate), 'days', true);
    if(typeof onChange === 'function'){
      onChange({target: {value: `${Math.ceil(myValue)}`}});
    }
  }

  return (
      readOnly ? (
        <Typography className={classes.daysEstimation}>
          {intl.formatMessage({ id: 'planningEstimatedCompletion' })} {intl.formatDate(getStartDate())}
        </Typography>
      ) : (
        <React.Fragment>
          <span className={clsx("MuiFormControl-root","MuiTextField-root",classes.datePickerContainer, classes.input)}>
            {showLabel &&
              <label className={clsx("MuiInputLabel-shrink", "MuiInputLabel-FormControl", "MuiFormLabel-root")}>{intl.formatMessage({ id: "daysEstimateMarketLabel" })}</label>
            }
            <DatePicker
              className={clsx("MuiInputBase-root", classes.input, classes.datePicker)}
              placeholderText={intl.formatMessage({ id: "selectDate" })}
              selected={getStartDate()}
              onChange={handleDateChange}
              popperPlacement="bottom"
            />
          </span>
          {showHelper &&
            <Typography>
              {intl.formatMessage({ id: "daysEstimateHelp" })}
            </Typography>
          }
        </React.Fragment>
      )
  );
}

const useInputSuffixStyles = makeStyles(
  theme => {
    return {
      root: {
        fontSize: "inherit",
        paddingTop: theme.spacing(2) + 2
      }
    };
  },
  { name: "InputSuffix" }
);
