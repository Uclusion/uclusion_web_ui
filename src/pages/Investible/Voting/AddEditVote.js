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
import { partialUpdateInvestment } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import clsx from 'clsx'
import { Dialog } from '../../../components/Dialogs'
import WarningIcon from '@material-ui/icons/Warning'
import { useLockedDialogStyles } from '../../Dialog/DialogEdit'
import InfoText from '../../../components/Descriptions/InfoText'
import { urlHelperGetName } from '../../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'

const useStyles = makeStyles(
  theme => {
    return {
      certainty: {},
      sideByside: {
        alignItems: "flex-start",
        display: "flex"
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
  const addMode = _.isEmpty(investment);
  const { quantity, max_budget: initialMaxBudget } = investment;
  const [validForm, setValidForm] = useState(false);
  const initialInvestment = addMode ? 50 : Math.abs(quantity);
  const [newQuantity, setNewQuantity] = useState(initialInvestment);
  const [maxBudget, setMaxBudget] = useState(initialMaxBudget || '');
  const { body, id: reasonId } = reason;
  const [reasonText, setReasonText] = useState(body || '');
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [open, setOpen] = useState(false);
  const warnClearVotes = !allowMultiVote && hasVoted && addMode;
  const defaultDefaultFunc = (newDefault) => {};
  const [editorDefaultFunc, setEditorDefaultFunc] = useState(() => defaultDefaultFunc);
  const [marketState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);

  function toggleOpen() {
    setOpen(!open);
  }

  // If new data comes in then reset
  useEffect(() => {
    const addMode = _.isEmpty(investment);
    const {
      quantity: investmentQuantity,
      max_budget: investmentBudget
    } = investment;
    const initialInvestment = addMode ? 50 : Math.abs(investmentQuantity);
    setNewQuantity(initialInvestment);
    setMaxBudget(investmentBudget || '');
    setReasonText(body || '');
    editorDefaultFunc(body);
  }, [investment, setNewQuantity, setMaxBudget, body, editorDefaultFunc]);

  useEffect(() => {
    // Long form to prevent flicker
    if (
      (showBudget && maxBudget > 0 && maxBudget <= storyMaxBudget) ||
      !showBudget
    ) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [showBudget, maxBudget, validForm, storyMaxBudget]);

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
      maxBudget
    };
    // console.debug(updateInfo);
    return updateInvestment(updateInfo).then(result => {
      // console.log("INVESTMENT");
      // console.log(result);
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
    return removeInvestment(marketId, investibleId);
  }

  function onChange(event) {
    const { value } = event.target;
    setNewQuantity(parseInt(value, 10));
  }

  function onBudgetChange(event) {
    const { value } = event.target;
    setMaxBudget(parseInt(value, 10));
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
          )}
          <QuillEditor
            marketId={marketId}
            placeholder={intl.formatMessage({ id: "yourReason" })}
            defaultValue={body}
            onChange={onEditorChange}
            uploadDisabled
            setOperationInProgress={setOperationRunning}
            setEditorDefaultFunc={(func) => {
              setEditorDefaultFunc(func);
            }}
            getUrlName={urlHelperGetName(marketState, investibleState)}
          />
        </CardContent>
        <CardActions className={classes.actions}>
          {multiplier && !addMode && (
            <SpinBlockingButton
              className={classes.secondaryAction}
              marketId={marketId}
              onClick={onRemove}
              onSpinStop={onSave}
            >
              {intl.formatMessage({ id: removeVoteId })}
            </SpinBlockingButton>
          )}
          {multiplier && saveEnabled && !warnClearVotes && (
            <SpinBlockingButton
              className={classes.primaryAction}
              marketId={marketId}
              onClick={mySave}
              disabled={!validForm}
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
            disabled={!validForm}
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
