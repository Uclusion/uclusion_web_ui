import * as React from 'react'
import { darken, makeStyles } from '@material-ui/core/styles'
import TextField from '@material-ui/core/TextField'
import { useIntl } from 'react-intl'
import 'react-datepicker/dist/react-datepicker.css'
import { Typography,} from '@material-ui/core'


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
        flex: 4,
        [theme.breakpoints.down('sm')]: {
          flex: 12,
        },
      },
      [theme.breakpoints.down('sm')]: {
        padding: '16px',
      },
    },
    cardActions: {
      paddingLeft: theme.spacing(6),
      paddingBottom: theme.spacing(2),
      [theme.breakpoints.down('sm')]: {
        paddingLeft: '16px',
      },
    },
    nestedCard: {
      "flex-grow": 1,
      margin: theme.spacing(1, 0),
      [theme.breakpoints.down('sm')]: {
        paddingLeft: '10px',
        paddingRight: '10px',
        flexDirection: 'column'
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

    daysEstimationContainer: {
      display: 'flex',
      alignItems: 'start',
      marginLeft: '1rem',
      marginRight: '1rem',
    },

    daysEstimation: {
      fontWeight:'700',
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
    avatarName: {
      fontSize: '15px',
      overflowWrap: 'break-word',
      cursor: 'pointer'
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
      marginRight: 10,
      [theme.breakpoints.down('sm')]: {
        width: 'auto'
      }
    },
    sectionHeader: {
      fontWeight: 700,
    },
    scrollContainer: {
      overflowY: 'scroll',
      height: 'calc(350px - (4rem + 20px))'
    },
    scrollableList: {
      overflowY: 'hidden',
      border: '1px solid #cfcfcf',
      borderRadius: 8,
      marginBottom: 15,
      [theme.breakpoints.down('sm')]: {
        marginRight: 0
      },
    },
    listItem: {
      paddingLeft: 0,
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
      height: '4rem',
      cursor: 'pointer'
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
      display: 'block',
      '& > label' : {
        display: 'block'
      },
      '& > div': {
        marginTop: 0,
        width: '100%'
      },
      '& .react-datepicker-popper': {
        zIndex: 8
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
    },
    disabled: {
      color: theme.palette.text.disabled,
    },
    manage: {
      [theme.breakpoints.up('md')]: {
        maxWidth: '50rem'
      },
    }
  }),
  { name: "PlanningAdd" }
);

const useSuffixedInput = makeStyles(
  { input: { textAlign: "center", padding: '10px' } },
  { name: "SuffixedInput" }
);

export function VoteExpiration(props) {
  const { value, onChange } = props;
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
        value={value}
        onChange={onChange}
      />
      <Typography>
        {intl.formatMessage({ id: "voteExpirationHelp" })}
      </Typography>
    </React.Fragment>
  );
}

export function Votes(props) {
  const { readOnly, value, onChange } = props;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const inputClasses = useInputSuffixStyles();

  return (
    <React.Fragment>
      <TextField
        className={classes.input}
        id="agile-plan-votes-required"
        InputProps={{ readOnly }}
        onChange={onChange}
        inputProps={{
          className: inputClasses.input,
          inputMode: "numeric",
          pattern: "[0-9]*",
          style: {textAlign: 'center'}
        }}
        value={value}
        label={intl.formatMessage({ id: "votesRequiredInputLabelShort" })}
      />
      <Typography>
        {intl.formatMessage({ id: "votesRequiredHelp" })}
      </Typography>
    </React.Fragment>
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
