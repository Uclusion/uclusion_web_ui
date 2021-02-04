import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { FormattedMessage, useIntl } from 'react-intl'
import {
  Button,
  Card,
  CardActions,
  CardContent,
  darken,
  FormControl,
  FormControlLabel,
  FormLabel,
  makeStyles,
  Radio,
  RadioGroup,
  TextField
} from '@material-ui/core'
import { removeInvestment, updateInvestment } from '../../../api/marketInvestibles'
import QuillEditor from '../../../components/TextEditors/QuillEditor'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import {
  getMarketComments,
  refreshMarketComments,
  removeComments
} from '../../../contexts/CommentsContext/commentsContextHelper'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketUnits, partialUpdateInvestment } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import clsx from 'clsx'
import { Dialog } from '../../../components/Dialogs'
import WarningIcon from '@material-ui/icons/Warning'
import { useLockedDialogStyles } from '../../Dialog/DialogBodyEdit'
import { urlHelperGetName } from '../../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import Autocomplete from '@material-ui/lab/Autocomplete'

const useStyles = makeStyles(
  theme => {
    return {
      sideBySide: {
        display: 'flex',
        paddingBottom: '5px',
      },
      overTop: {
        display: 'flex',
        paddingBottom: '3px',
      },
      certainty: {},
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
      maxBudgetUnit: {
        width: 230
      },
      actions: {
        display: "flex",
        padding: theme.spacing(0, 0, 1, 2)
      },
      primaryAction: {
        backgroundColor: "#2F80ED",
        color: "white",
        textTransform: "capitalize",
        "&:hover": {
          backgroundColor: darken("#2F80ED", 0.08)
        },
        "&:focus": {
          backgroundColor: darken("#2F80ED", 0.24)
        }
      },
      secondaryAction: {
        backgroundColor: "#8C8C8C",
        color: "white",
        textTransform: "capitalize",
        "&:hover": {
          backgroundColor: darken("#8C8C8C", 0.04)
        },
        "&:focus": {
          backgroundColor: darken("#8C8C8C", 0.12)
        }
      }
    };
  },
  { name: "VoteAdd" }
);

function AddEditVote(props) {
  const {
    reason,
    marketId,
    investibleId,
    investment,
    onSave,
    showBudget,
    storyMaxBudget,
    hasVoted,
    allowMultiVote,
    multiplier
  } = props;
  const intl = useIntl();
  const classes = useStyles();
  const addMode = _.isEmpty(investment) || investment.deleted;
  const { quantity, max_budget: initialMaxBudget, max_budget_unit: initialMaxBudgetUnit } = investment;
  const initialInvestment = !quantity ? 50 : Math.abs(quantity);
  const [newQuantity, setNewQuantity] = useState(initialInvestment);
  const [maxBudget, setMaxBudget] = useState(initialMaxBudget || '');
  const [maxBudgetUnit, setMaxBudgetUnit] = useState(initialMaxBudgetUnit || '');
  const { body, id: reasonId } = reason;
  const [reasonText, setReasonText] = useState(body || '');
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [marketPresencesState, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [open, setOpen] = useState(false);
  const warnClearVotes = !allowMultiVote && hasVoted && _.isEmpty(investment);
  const [marketState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const myHelperText = storyMaxBudget ?
    intl.formatMessage({ id: "maxBudgetInputHelperText" }, { x: storyMaxBudget + 1 }) : '';
  const units = getMarketUnits(marketPresencesState, marketId, intl);
  const defaultProps = {
    options: units,
    getOptionLabel: (option) => option,
  };
  function toggleOpen() {
    setOpen(!open);
  }

  const saveEnabled =
    addMode ||
    newQuantity !== initialInvestment ||
    maxBudget !== initialMaxBudget ||
    reasonText !== body || (quantity < 0 && multiplier > 0) || (quantity > 0 && multiplier < 0);

  function mySave() {
    // console.debug("saving now");
    const oldQuantity = addMode ? 0 : quantity;
    // dont include reason text if it's not changing, otherwise we'll update the reason comment
    const reasonNeedsUpdate = reasonText !== body && !(_.isEmpty(reasonText) && _.isEmpty(body));
    const updateInfo = {
      marketId,
      investibleId,
      newQuantity: newQuantity*multiplier,
      currentQuantity: oldQuantity,
      newReasonText: reasonText,
      currentReasonId: reasonId,
      reasonNeedsUpdate,
      maxBudget,
      maxBudgetUnit
    };
    // console.debug(updateInfo);
    return updateInvestment(updateInfo).then(result => {
      return {
        result,
        spinChecker: () => Promise.resolve(true),
      };
    });
  }

  function onSaveSpinStop(result) {
    if (!result) {
      return;
    }
    const { commentResult, investmentResult } = result;
    const { commentAction, comment } = commentResult;
    const { id: commentId } = comment;
    if (commentAction === "DELETED") {
      removeComments(commentsDispatch, marketId, [commentId]);
    } else if (commentAction !== "NOOP") {
      const comments = getMarketComments(commentsState, marketId);
      refreshMarketComments(commentsDispatch, marketId, [comment, ...comments]);
    }
    partialUpdateInvestment(marketPresencesDispatch, investmentResult, allowMultiVote);
    onSave();
  }

  function onRemove() {
    return removeInvestment(marketId, investibleId).then(result => {
      return {
        result,
        spinChecker: () => Promise.resolve(true),
      };
    });
  }

  function onChange(event) {
    const { value } = event.target;
    setNewQuantity(parseInt(value, 10));
  }

  function onBudgetChange(event) {
    const { value } = event.target;
    setMaxBudget(parseInt(value, 10));
  }

  function onUnitChange(event, value) {
    setMaxBudgetUnit(value);
  }

  function onEditorChange(body) {
    setReasonText(body);
  }
  const lockedDialogClasses = useLockedDialogStyles();
  const voteId = multiplier < 0 ? "saveReject" : "saveVote";
  const updateVoteId = multiplier < 0 ? "updateReject" : "updateVote";
  const removeVoteId = multiplier < 0 ? "removeReject" : "removeVote";
  return (
    <React.Fragment>
      <Card elevation={0}>
        <CardContent>
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
          {showBudget && (
            <>
              <div className={classes.overTop}>
                <FormattedMessage id="agilePlanFormMaxMaxBudgetInputLabel" />
              </div>
              <div className={classes.sideBySide}>
                <TextField
                  className={classes.maxBudget}
                  id="vote-max-budget"
                  label={intl.formatMessage({ id: "maxBudgetInputLabel" })}
                  type="number"
                  variant="filled"
                  onChange={onBudgetChange}
                  value={maxBudget}
                  error={storyMaxBudget > 0 && maxBudget > storyMaxBudget}
                  helperText={myHelperText}
                />
                <Autocomplete
                  {...defaultProps}
                  id="addBudgetUnit"
                  key="budgetUnit"
                  freeSolo
                  renderInput={(params) => <TextField {...params}
                                                      label={intl.formatMessage({ id: 'addUnit' })}
                                                      variant="outlined" />}
                  value={maxBudgetUnit}
                  className={classes.maxBudgetUnit}
                  onInputChange={onUnitChange}
                />
              </div>
            </>
          )}
          <QuillEditor
            marketId={marketId}
            placeholder={intl.formatMessage({ id: "yourReason" })}
            defaultValue={body}
            onChange={onEditorChange}
            uploadDisabled
            setOperationInProgress={setOperationRunning}
            getUrlName={urlHelperGetName(marketState, investibleState)}
          />
        </CardContent>
        <CardActions className={classes.actions}>
          {multiplier && !addMode && (
            <SpinBlockingButton
              className={classes.secondaryAction}
              marketId={marketId}
              onClick={onRemove}
              onSpinStop={onSaveSpinStop}
            >
              {intl.formatMessage({ id: removeVoteId })}
            </SpinBlockingButton>
          )}
          {multiplier && saveEnabled && !warnClearVotes && (
            <SpinBlockingButton
              className={classes.primaryAction}
              marketId={marketId}
              onClick={mySave}
              onSpinStop={onSaveSpinStop}
              hasSpinChecker
            >
              {addMode
                ? intl.formatMessage({ id: voteId })
                : intl.formatMessage({ id: updateVoteId })}
            </SpinBlockingButton>
          )}
          {multiplier && saveEnabled && warnClearVotes && (
            <Button onClick={toggleOpen} className={classes.primaryAction}>
              {intl.formatMessage({ id: voteId })}
            </Button>
          )}
        </CardActions>
      </Card>
      <ClearVotesDialog
        classes={lockedDialogClasses}
        open={open}
        onClose={toggleOpen}
        issueWarningId="clearVotes"
        /* slots */
        actions={
          <SpinBlockingButton
            className={clsx(
              lockedDialogClasses.action,
              lockedDialogClasses.actionEdit
            )}
            disableFocusRipple
            marketId={marketId}
            onClick={mySave}
            hasSpinChecker
            onSpinStop={onSaveSpinStop}
          >
            <FormattedMessage id="issueProceed" />
          </SpinBlockingButton>
        }
      />
    </React.Fragment>
  );
}

function ClearVotesDialog(props) {
  const { actions, classes, open, onClose, issueWarningId } = props;

  const autoFocusRef = React.useRef(null);

  return (
    <Dialog
      autoFocusRef={autoFocusRef}
      classes={{
        root: classes.root,
        actions: classes.actions,
        content: classes.issueWarningContent,
        title: classes.title
      }}
      open={open}
      onClose={onClose}
      /* slots */
      actions={
        <React.Fragment>
          {actions}
          <Button
            className={clsx(classes.action, classes.actionCancel)}
            disableFocusRipple
            onClick={onClose}
            ref={autoFocusRef}
          >
            <FormattedMessage id="lockDialogCancel" />
          </Button>
        </React.Fragment>
      }
      content={<FormattedMessage id={issueWarningId} />}
      title={
        <React.Fragment>
          <WarningIcon className={classes.warningTitleIcon} />
          <FormattedMessage id="warning" />
        </React.Fragment>
      }
    />
  );
}

ClearVotesDialog.propTypes = {
  actions: PropTypes.node.isRequired,
  onClose: PropTypes.func.isRequired,
  open: PropTypes.bool.isRequired,
  issueWarningId: PropTypes.string.isRequired,
};

AddEditVote.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  reason: PropTypes.object,
  showBudget: PropTypes.bool,
  storyMaxBudget: PropTypes.number,
  marketId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  investment: PropTypes.object,
  onSave: PropTypes.func,
  hasVoted: PropTypes.bool,
  allowMultiVote: PropTypes.bool,
  multiplier: PropTypes.number,
};

AddEditVote.defaultProps = {
  showBudget: false,
  hasVoted: false,
  allowMultiVote: true,
  investment: {},
  storyMaxBudget: 0,
  onSave: () => {},
  reason: {},
  multipler: 1,
};

export default AddEditVote;
