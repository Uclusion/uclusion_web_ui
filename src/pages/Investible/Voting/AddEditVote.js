import React, { useContext, useState } from 'react'
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
  makeStyles,
  Radio,
  RadioGroup,
  TextField
} from '@material-ui/core'
import { removeInvestment, updateInvestment } from '../../../api/marketInvestibles'
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
import { useLockedDialogStyles } from '../../Dialog/DialogBodyEdit'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Add, Clear, Delete, SettingsBackupRestore } from '@material-ui/icons'
import { editorReset, useEditor } from '../../../components/TextEditors/quillHooks';
import { removeMessage } from '../../../contexts/NotificationsContext/notificationsContextReducer'
import { getQuillStoredState } from '../../../components/TextEditors/QuillEditor2'
import InputAdornment from '@material-ui/core/InputAdornment'
import IssueDialog from '../../../components/Warnings/IssueDialog'

const useStyles = makeStyles(
  theme => {
    return {
      sideBySide: {
        display: 'flex',
        paddingBottom: '1rem',
      },
      visible: {
        overflow: 'visible'
      },
      overTop: {
        display: 'flex',
        paddingBottom: '0.5rem',
      },
      certainty: {},
      certaintyGroup: {
        marginTop: theme.spacing(1),
        display: "flex",
        flexDirection: "row"
      },
      certaintyValue: {
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
        display: "block",
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
    marketBudgetUnit,
    hasVoted,
    allowMultiVote,
    multiplier,
    votingPageState, updateVotingPageState, votingPageStateReset,
    messagesDispatch, voteMessage
  } = props;
  const {
    storedInvestment,
    storedMaxBudget,
    useInitial
  } = votingPageState;
  const intl = useIntl();
  const classes = useStyles();
  const addMode = _.isEmpty(investment) || investment.deleted;
  const { quantity, max_budget: initialMaxBudget, max_budget_unit: initialMaxBudgetUnit } = investment || {};
  const initialInvestment = !quantity ? undefined : Math.abs(quantity);
  const newQuantity = storedInvestment || (useInitial === false ? undefined : initialInvestment);
  const maxBudget = storedMaxBudget !== undefined ? storedMaxBudget :
    (useInitial === false ? '' : (initialMaxBudget || ''));
  const maxBudgetUnit = initialMaxBudgetUnit || marketBudgetUnit;
  const { body, id: reasonId } = reason;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [open, setOpen] = useState(false);
  const [openIssue, setOpenIssue] = useState(false);
  const warnClearVotes = !allowMultiVote && hasVoted && _.isEmpty(investment);

  function toggleOpen() {
    setOpen(!open);
  }

  const editorName = `${investibleId}-add-edit-vote-reason`;
  const editorSpec = {
    marketId,
    placeholder: intl.formatMessage({ id: "yourReason" }),
    value: getQuillStoredState(editorName) || useInitial === false ? undefined : body,
    uploadDisabled: true,
  };
  const [Editor, editorController] = useEditor(editorName, editorSpec);

  function mySave() {
    if (newQuantity === undefined || multiplier === undefined) {
      setOperationRunning(false);
      setOpenIssue(multiplier === undefined ? 'noMultiplier' : 'noVoteQuantity');
      return;
    }
    const reasonText = getQuillStoredState(editorName) !== null ? getQuillStoredState(editorName) :
      useInitial === false ? undefined : body;
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

    return updateInvestment(updateInfo).then(result => {
      onSaveSpinStop(result);
      setOperationRunning(false);
    });
  }

  function onSaveSpinStop(result) {
    if (!result) {
      if (open) {
        toggleOpen();
      }
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
    if (voteMessage) {
      messagesDispatch(removeMessage(voteMessage));
    }
    if (open) {
      toggleOpen();
    }
    votingPageStateReset();
    onSave();
  }

  function onRemove() {
    return removeInvestment(marketId, investibleId).then(result => {
      setOperationRunning(false);
      onSaveSpinStop(result);
    });
  }

  function onCancel() {
    votingPageStateReset();
    editorController(editorReset());
    if ((investment || {}).deleted) {
      // User decided to discard what was there before deleted
      updateVotingPageState({useInitial: false});
    }
  }

  function onChange(event) {
    const { value } = event.target;
    updateVotingPageState({storedInvestment: parseInt(value, 10)});
  }

  function onBudgetChange(event) {
    const { value } = event.target;
    if (_.isEmpty(value)) {
      updateVotingPageState({storedMaxBudget: ''});
    } else {
      updateVotingPageState({storedMaxBudget: parseInt(value, 10)});
    }
  }

  const lockedDialogClasses = useLockedDialogStyles();
  const voteId = multiplier < 0 ? "saveReject" : "saveVote";
  const updateVoteId = multiplier < 0 ? "updateReject" : "updateVote";
  const removeVoteId = multiplier < 0 ? "removeReject" : "removeVote";
  return (
    <React.Fragment>
      <Card className={classes.visible} id="approve">
        <CardContent>
          <FormControl className={classes.certainty}>
            <FormattedMessage id="certaintyQuestion" />
            <RadioGroup
              aria-labelledby="add-vote-certainty"
              className={classes.certaintyGroup}
              onChange={onChange}
              value={newQuantity || 0}
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
                  label={intl.formatMessage({ id: 'maxBudgetInputLabel' })}
                  type="number"
                  variant="outlined"
                  onChange={onBudgetChange}
                  value={maxBudget}
                  margin="dense"
                  InputProps={{
                    endAdornment:
                      <InputAdornment position="end">
                        {maxBudgetUnit}
                      </InputAdornment>,
                  }}
                />
              </div>
            </>
          )}
          {Editor}
        </CardContent>
        <CardActions className={classes.actions}>
          <SpinningIconLabelButton onClick={onCancel} doSpin={false} icon={Clear}>
            {intl.formatMessage({ id: (!_.isEmpty(investment) && !investment.deleted) ? 'cancel' : 'clear' })}
          </SpinningIconLabelButton>
          {multiplier && !addMode && (
            <SpinningIconLabelButton
              icon={Delete}
              onClick={onRemove}
              id="removeVoteButton"
            >
              {intl.formatMessage({ id: removeVoteId })}
            </SpinningIconLabelButton>
          )}
          {!warnClearVotes && (
            <SpinningIconLabelButton
              icon={addMode ? Add : SettingsBackupRestore}
              onClick={mySave}
              id="addOrUpdateVoteButton"
            >
              {addMode
                ? intl.formatMessage({ id: voteId })
                : intl.formatMessage({ id: updateVoteId })}
            </SpinningIconLabelButton>
          )}
          {warnClearVotes && (
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
      {openIssue !== false && (
        <IssueDialog
          classes={lockedDialogClasses}
          open={openIssue !== false}
          onClose={() => setOpenIssue(false)}
          issueWarningId={openIssue}
          showDismiss={false}
        />
      )}
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
  reason: PropTypes.object,
  showBudget: PropTypes.bool,
  marketId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
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
  onSave: () => {},
  reason: {},
  multipler: 1,
};

export default AddEditVote;
