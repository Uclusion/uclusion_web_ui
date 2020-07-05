import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { FormattedMessage, useIntl } from 'react-intl'
import {
  Card,
  CardContent,
  FormControl,
  FormControlLabel,
  FormLabel,
  makeStyles,
  Radio,
  RadioGroup,
  TextField
} from '@material-ui/core'
import QuillEditor from '../../../components/TextEditors/QuillEditor'
import InfoText from '../../../components/Descriptions/InfoText'
import { urlHelperGetName } from '../../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'

const useStyles = makeStyles(
  theme => {
    return {
      certainty: {},
      cardContent: {
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
      certaintyGroup: {
        display: "flex",
        flexDirection: "row"
      },
      certaintyLabel: {
        marginBottom: theme.spacing(2),
        textTransform: "capitalize"
      },
      certaintyValue: {
        backgroundColor: theme.palette.grey["300"],
        borderRadius: 6,
        paddingLeft: theme.spacing(1),
        margin: theme.spacing(0, 2, 2, 0)
      },
      certaintyValueLabel: {
        fontWeight: "bold"
      },
      divider: {
        margin: theme.spacing(2, 0)
      },
      maxBudget: {
        display: "block"
      },
    };
  },
  { name: "VoteAdd" }
);

function AddInitialVote(props) {
  const {
    marketId,
    storyMaxBudget,
    onEditorChange,
    onBudgetChange,
    onChange,
    newQuantity,
    maxBudget,
    body,
  } = props;
  const intl = useIntl();
  const classes = useStyles();
  const [marketState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);

  return (
    <Card elevation={0}>
      <CardContent className={classes.cardContent}>
        <h2>{ intl.formatMessage({ id: 'pleaseVoteStory' }) }</h2>
        <FormControl className={classes.certainty}>
          <FormLabel
            className={classes.certaintyLabel}
            id="add-vote-certainty"
          >
            <FormattedMessage id="certaintyQuestion" />
          </FormLabel>
          <RadioGroup
            aria-labelledby="add-vote-certainty"
            className={classes.certaintyGroup}
            onChange={onChange}
            value={newQuantity}
          >
            {[5, 25, 50, 75, 100].map(certainty => {
              return (
                <FormControlLabel
                  key={certainty}
                  className={classes.certaintyValue}
                  classes={{
                    label: classes.certaintyValueLabel
                  }}
                  /* prevent clicking the label stealing focus */
                  onMouseDown={e => e.preventDefault()}
                  control={<Radio />}
                  label={<FormattedMessage id={`certainty${certainty}`} />}
                  labelPlacement="start"
                  value={certainty}
                />
              );
            })}
          </RadioGroup>
        </FormControl>
        <InfoText textId="agilePlanFormMaxMaxBudgetInputLabel">
          <TextField
            className={classes.maxBudget}
            id="vote-max-budget"
            label={intl.formatMessage({ id: "maxBudgetInputLabel" })}
            type="number"
            variant="filled"
            onChange={onBudgetChange}
            value={maxBudget}
            error={maxBudget > storyMaxBudget}
            helperText={intl.formatMessage(
              {
                id: "maxBudgetInputHelperText"
              },
              { x: storyMaxBudget + 1 }
            )}
          />
        </InfoText>
        <QuillEditor
          marketId={marketId}
          placeholder={intl.formatMessage({ id: "yourReason" })}
          defaultValue={body}
          onChange={onEditorChange}
          uploadDisabled
          getUrlName={urlHelperGetName(marketState, investibleState)}
        />
      </CardContent>
    </Card>
  );
}

AddInitialVote.propTypes = {
  storyMaxBudget: PropTypes.number,
  marketId: PropTypes.string.isRequired,
  onEditorChange: PropTypes.func.isRequired,
  onBudgetChange: PropTypes.func.isRequired,
  onChange: PropTypes.func.isRequired,
  newQuantity: PropTypes.number,
  maxBudget: PropTypes.any,
  body: PropTypes.string
};

export default AddInitialVote;
