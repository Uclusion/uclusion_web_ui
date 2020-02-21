import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl'
import TextField from '@material-ui/core/TextField';
import {
  Paper,
  RadioGroup,
  FormControl,
  FormControlLabel,
  FormLabel,
  Radio,
  Typography,
  Grid, Button, makeStyles,
} from '@material-ui/core'
import { removeInvestment, updateInvestment } from '../../../api/marketInvestibles';
import QuillEditor from '../../../components/TextEditors/QuillEditor';
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import SpinBlockingButtonGroup from '../../../components/SpinBlocking/SpinBlockingButtonGroup';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { refreshMarketComments, removeComments } from '../../../contexts/CommentsContext/commentsContextHelper';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { partialUpdateInvestment } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import clsx from 'clsx';
import { Dialog } from '../../../components/Dialogs';
import WarningIcon from '@material-ui/icons/Warning';
import { useLockedDialogStyles } from '../../Dialog/DialogEdit'

const useStyles = makeStyles(() => ({
  button: {
    borderRadius: '4px',
    fontSize: '14px',
    fontWeight: 'bold',
    margin: 8,
    textTransform: 'capitalize',
  },
}), { name: 'VoteAdd' });

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
  } = props;
  const intl = useIntl();
  const classes = useStyles();
  const addMode = _.isEmpty(investment);
  const { quantity, max_budget: initialMaxBudget } = investment;
  const [validForm, setValidForm] = useState(false);
  const initialInvestment = (addMode) ? 50 : quantity;
  const [newQuantity, setNewQuantity] = useState(initialInvestment);
  const [maxBudget, setMaxBudget] = useState(initialMaxBudget);
  const { body, id: reasonId } = reason;
  const [reasonText, setReasonText] = useState(body);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [open, setOpen] = useState(body);
  const warnClearVotes = !allowMultiVote && hasVoted && addMode;

  function toggleOpen() {
    setOpen(!open);
  }

  // If new investment data comes in, reset the quantity and budget
  useEffect(() => {
    const addMode = _.isEmpty(investment);
    const {
      quantity: investmentQuantity,
      max_budget: investmentBudget,
    } = investment;

    const initialInvestment = (addMode) ? 50 : investmentQuantity;
    setNewQuantity(initialInvestment);
    setMaxBudget(investmentBudget);
  }, [investment, setNewQuantity, setMaxBudget]);


  useEffect(() => {
    // Long form to prevent flicker
    if ((showBudget && maxBudget > 0 && maxBudget <= storyMaxBudget) || (!showBudget)) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [showBudget, maxBudget, validForm, storyMaxBudget]);

  const saveEnabled = addMode || (newQuantity !== initialInvestment) || (maxBudget !== initialMaxBudget)
    || (reasonText !== body);

  function mySave() {
    console.debug('saving now');
    const oldQuantity = addMode ? 0 : quantity;
    // dont include reason text if it's not changing, otherwise we'll update the reason comment
    const reasonNeedsUpdate = reasonText !== body;
    const updateInfo = {
      marketId,
      investibleId,
      newQuantity,
      currentQuantity: oldQuantity,
      newReasonText: reasonText,
      currentReasonId: reasonId,
      reasonNeedsUpdate,
      maxBudget,
    };
    console.debug(updateInfo);
    return updateInvestment(updateInfo)
      .then((result) => {
        console.log('INVESTMENT');
        console.log(result);
        return {
          result,
          spinChecker: () => Promise.resolve(true),
        };
      })
  }

  function onSaveSpinStop(result) {
    if (!result) {
      return;
    }
    const { commentResult, investmentResult } = result;
    const { commentAction, comment } = commentResult;
    const { id: commentId } = comment;
    if (commentAction === 'DELETED') {
      removeComments(commentsDispatch, marketId, [commentId]);
    } else if (commentAction !== 'NOOP') {
      refreshMarketComments(commentsDispatch, marketId, [comment]);
    }
    partialUpdateInvestment(marketPresencesDispatch, investmentResult);
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
  return (
    <Paper>
      <FormControl
        component="fieldset"
      >
        <FormLabel component="legend">{intl.formatMessage({ id: 'certaintyQuestion' })}</FormLabel>
        <RadioGroup
          value={newQuantity}
          onChange={onChange}
        >
          <Grid
            container
            justify="space-between"
          >
            <Grid
              item
              xs={2}
            >
              <FormControlLabel
                labelPlacement="bottom"
                control={<Radio/>}
                label={intl.formatMessage({ id: 'uncertain' })}
                value={0}
              />
            </Grid>
            <Grid
              item
              xs={2}
            >
              <FormControlLabel
                labelPlacement="bottom"
                control={<Radio/>}
                label={intl.formatMessage({ id: 'somewhatUncertain' })}
                value={25}
              />
            </Grid>
            <Grid
              item
              xs={2}
            >
              <FormControlLabel
                labelPlacement="bottom"
                control={<Radio/>}
                label={intl.formatMessage({ id: 'somewhatCertain' })}
                value={50}
              />
            </Grid>
            <Grid
              item
              xs={2}
            >
              <FormControlLabel
                labelPlacement="bottom"
                control={<Radio/>}
                label={intl.formatMessage({ id: 'certain' })}
                value={75}
              />
            </Grid>
            <Grid
              item
              xs={2}
            >
              <FormControlLabel
                labelPlacement="bottom"
                control={<Radio/>}
                label={intl.formatMessage({ id: 'veryCertain' })}
                value={100}
              />
            </Grid>
          </Grid>
        </RadioGroup>
      </FormControl>
      <br/>
      {showBudget && (
        <TextField
          id="standard-number"
          label={intl.formatMessage({ id: 'maxBudgetInputLabel' }, { x: storyMaxBudget + 1 })}
          type="number"
          InputLabelProps={{
            shrink: true,
          }}
          variant="outlined"
          onChange={onBudgetChange}
          value={maxBudget}
          error={maxBudget > storyMaxBudget}
        />
      )}
      <Typography>{intl.formatMessage({ id: 'reasonQuestion' })}</Typography>
      <QuillEditor
        placeholder={intl.formatMessage({ id: 'yourReason' })}
        defaultValue={body}
        onChange={onEditorChange}
        uploadDisabled
        setOperationInProgress={setOperationRunning}
      />
      <SpinBlockingButtonGroup>
        {!addMode && (
          <SpinBlockingButton
            size="small"
            marketId={marketId}
            onClick={() => onRemove()}
            onSpinStop={onSave}
          >
            {intl.formatMessage({ id: 'removeVote' })}
          </SpinBlockingButton>
        )}
        {saveEnabled && !warnClearVotes && (
          <SpinBlockingButton
            marketId={marketId}
            onClick={mySave}
            disabled={!validForm}
            onSpinStop={onSaveSpinStop}
            hasSpinChecker
          >
            {addMode ? intl.formatMessage({ id: 'saveVote' }) : intl.formatMessage({ id: 'updateVote' })}
          </SpinBlockingButton>
        )}
        {saveEnabled && warnClearVotes && (
          <Button
            onClick={toggleOpen}
            className={classes.button}
          >
            {intl.formatMessage({ id: 'saveVote' })}
          </Button>
        )}
      </SpinBlockingButtonGroup>
      <ClearVotesDialog
        classes={lockedDialogClasses}
        open={open}
        onClose={toggleOpen}
        issueWarningId="clearVotes"
        /* slots */
        actions={
          <SpinBlockingButton
            className={clsx(lockedDialogClasses.action, lockedDialogClasses.actionEdit)}
            disableFocusRipple
            marketId={marketId}
            onClick={mySave}
            onSpinStop={onSaveSpinStop}
            disabled={!validForm}
          >
            <FormattedMessage id="issueProceed" />
          </SpinBlockingButton>
        }
      />
    </Paper>
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
};

AddEditVote.defaultProps = {
  showBudget: false,
  hasVoted: false,
  allowMultiVote: true,
  investment: {},
  storyMaxBudget: 0,
  onSave: () => {
  },
  reason: {},
};

export default AddEditVote;
