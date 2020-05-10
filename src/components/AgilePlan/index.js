import * as React from 'react'
import Button from '@material-ui/core/Button'
import Card from '@material-ui/core/Card'
import CardActions from '@material-ui/core/CardActions'
import CardContent from '@material-ui/core/CardContent'
import InputAdornment from '@material-ui/core/InputAdornment'
import { darken, makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import { FormattedMessage, useIntl } from 'react-intl'
import SpinBlockingButton from '../../components/SpinBlocking/SpinBlockingButton'
import CardType, { AGILE_PLAN_TYPE } from '../../components/CardType'
import QuillEditor from '../../components/TextEditors/QuillEditor'
import InfoText from '../Descriptions/InfoText'
import DatePicker from 'react-datepicker'
import 'react-datepicker/dist/react-datepicker.css'
import moment from 'moment'
import { Typography } from '@material-ui/core'

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
      }
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
    emailInput: {
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
    createEnabled
  } = props;

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
    <Card>
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
          setOperationInProgress={setOperationRunning}
        />
        <fieldset className={classes.fieldset}>
          <legend>{intl.formatMessage({ id: "optionalEdit" })}</legend>
          <MaxBudget onChange={onMaxBudgetChange} value={maxBudget} />
          <VoteExpiration
            onChange={onInvestmentExpirationChange}
            value={investmentExpiration}
          />
          <Votes onChange={onVotesRequiredChange} value={votesRequired} />
          <DaysEstimate onChange={onDaysEstimate} value={daysEstimate} createdAt={createdAt} />
        </fieldset>
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
  { input: { textAlign: "right" } },
  { name: "SuffixedInput" }
);

export function MaxBudget(props) {
  const { readOnly, ...other } = props;
  const intl = useIntl();

  const classes = useSuffixedInput();

  return (
    <InfoText textId="maxBudgetHelp" useDl={false}>
      <TextField
        id="agile-plan-max-budget"
        InputProps={{
          endAdornment: <InputSuffix>days</InputSuffix>,
          readOnly
        }}
        inputProps={{
          className: classes.input,
          inputMode: "numeric",
          size: 4,
          pattern: "[0-9]*"
        }}
        label={intl.formatMessage({
          id: "agilePlanFormMaxMaxBudgetInputLabel"
        })}
        placeholder="14"
        variant="filled"
        {...other}
      />
    </InfoText>
  );
}
export function VoteExpiration(props) {
  const { readOnly, ...other } = props;
  const intl = useIntl();

  const classes = useSuffixedInput();

  return (
    <InfoText textId="voteExpirationHelp" useDl={false}>
      <TextField
        InputProps={{
          endAdornment: <InputSuffix>days</InputSuffix>,
          readOnly
        }}
        id="agile-plan-expiration"
        inputProps={{
          className: classes.input,
          inputMode: "numeric",
          size: 4,
          pattern: "[0-9]*"
        }}
        label={intl.formatMessage({
          id: "agilePlanFormInvestmentExpirationLabel"
        })}
        variant="filled"
        {...other}
      />
    </InfoText>
  );
}

export function Votes(props) {
  const { readOnly, ...other } = props;
  const intl = useIntl();

  return (
    <InfoText textId="votesRequiredHelp" useDl={false}>
      <TextField
        helperText={
          !readOnly &&
          intl.formatMessage({
            id: "votesRequiredInputHelperText"
          })
        }
        id="agile-plan-votes-required"
        InputProps={{ readOnly }}
        inputProps={{
          inputMode: "numeric",
          size: 8,
          pattern: "[0-9]*",
          style: {textAlign: 'center'}
        }}
        label={intl.formatMessage({ id: "votesRequiredInputLabelShort" })}
        variant="filled"
        {...other}
      />
    </InfoText>
  );
}

export function DaysEstimate(props) {
  const { readOnly, value, onChange, createdAt } = props;
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
    onChange({target: {value: `${Math.ceil(myValue)}`}});
  }

  return (
      readOnly ? (
        <Typography className={classes.daysEstimation}>
          {intl.formatMessage({ id: 'planningEstimatedCompletion' })} {intl.formatDate(getStartDate())}
        </Typography>
      ) : (
        <InfoText textId="daysEstimateHelp" useDl={false}>
          <DatePicker
            placeholderText={intl.formatMessage({ id: "selectDate" })}
            selected={getStartDate()}
            onChange={handleDateChange}
          />
        </InfoText>
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

function InputSuffix(props) {
  const { children } = props;
  const classes = useInputSuffixStyles();

  return (
    <InputAdornment className={classes.root} disableTypography position="end">
      {children}
    </InputAdornment>
  );
}
