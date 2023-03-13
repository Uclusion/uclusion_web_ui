import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  Card,
  CardContent,
  darken,
  FormControl,
  FormControlLabel,
  makeStyles,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  TextField,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import { updateInvestment } from '../../../api/marketInvestibles';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { useEditor } from '../../../components/TextEditors/quillHooks';
import InputAdornment from '@material-ui/core/InputAdornment';
import { processTextAndFilesForSave } from '../../../api/files';
import { workListStyles } from '../../Home/YourWork/WorkListItem';
import { focusEditor, getQuillStoredState } from '../../../components/TextEditors/Utilities/CoreUtils';
import WizardStepButtons from '../../../components/InboxWizards/WizardStepButtons';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { commonQuick } from '../../../components/AddNewWizards/Approval/ApprovalWizard';

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

function getEditVoteEditorName(investibleId, isInbox) {
  return `${isInbox ? 'inbox' : ''}add-edit-vote-reason${investibleId}`;
}

export function addEditVotingHasContents(investibleId, isInbox, operationRunning) {
  return !_.isEmpty(getQuillStoredState(getEditVoteEditorName(investibleId, isInbox))) &&
    !['voteIssueProceedButton', 'addOrUpdateVoteButton'].includes(operationRunning);
}

function AddEditVote(props) {
  const {
    reason,
    marketId,
    investibleId,
    groupId,
    investment,
    showBudget,
    marketBudgetUnit,
    multiplier, wizardProps,
    formData, updateFormData, clearFormData, voteMessage, isInbox
  } = props;
  const {
    storedInvestment,
    storedMaxBudget,
    useInitial,
    uploadedFiles,
  } = formData;
  const intl = useIntl();
  const classes = useStyles();
  const workItemClasses = workListStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const addMode = _.isEmpty(investment) || investment.deleted;
  const { quantity, max_budget: initialMaxBudget, max_budget_unit: initialMaxBudgetUnit } = investment || {};
  const initialInvestment = !quantity ? undefined : Math.abs(quantity);
  const newQuantity = storedInvestment || (useInitial === false ? undefined : initialInvestment);
  const maxBudget = storedMaxBudget !== undefined ? storedMaxBudget :
    (useInitial === false ? '' : (initialMaxBudget || ''));
  const maxBudgetUnit = initialMaxBudgetUnit || marketBudgetUnit;
  const { body, id: reasonId } = reason || {};
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);

  const editorName = getEditVoteEditorName(investibleId, isInbox);
  const editorSpec = {
    marketId,
    placeholder: intl.formatMessage({ id: 'yourReason' }),
    value: getQuillStoredState(editorName) || useInitial === false ? undefined : body,
    onUpload: (files) => updateFormData({uploadedFiles: files})
  };
  const [Editor, resetEditor] = useEditor(editorName, editorSpec);

  function mySave() {
    const currentUploadedFiles = uploadedFiles || [];
    const myBodyNow = getQuillStoredState(editorName);
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(currentUploadedFiles, myBodyNow);
    const reasonText =  tokensRemoved !== null ? tokensRemoved : useInitial === false ? undefined : body;
    const oldQuantity = addMode ? 0 : quantity;
    // dont include reason text if it's not changing, otherwise we'll update the reason comment
    const reasonNeedsUpdate = reasonText !== body && !(_.isEmpty(reasonText) && _.isEmpty(body));
    const updateInfo = {
      marketId,
      investibleId,
      groupId,
      newQuantity: newQuantity*multiplier,
      currentQuantity: oldQuantity,
      newReasonText: reasonText,
      currentReasonId: reasonId,
      reasonNeedsUpdate,
      maxBudget,
      maxBudgetUnit,
      uploadedFiles: filteredUploads
    };

    return updateInvestment(updateInfo).then(result => {
      resetEditor('', {placeholder: intl.formatMessage({ id: 'yourReason' })});
      commonQuick(result, commentsDispatch, marketId, commentsState, marketPresencesDispatch, undefined,
        workItemClasses, messagesDispatch, clearFormData, setOperationRunning, voteMessage);
    });
  }

  function onChange(event) {
    const { value } = event.target;
    updateFormData({storedInvestment: parseInt(value, 10)});
    focusEditor(editorName);
  }

  function onBudgetChange(event) {
    const { value } = event.target;
    if (_.isEmpty(value)) {
      updateFormData({storedMaxBudget: ''});
    } else {
      updateFormData({storedMaxBudget: parseInt(value, 10)});
    }
  }

  const voteId = multiplier < 0 ? "saveReject" : "saveVote";
  const certainties = [5, 25, 50, 75, 100];
  return (
    <React.Fragment>
      <Card className={classes.visible} id="approve">
        <CardContent>
          <FormControl className={classes.certainty}>
            {_.isEmpty(wizardProps) && (
              <FormattedMessage id="certaintyQuestion" />
            )}
            {mobileLayout && (
              <Select
                value={newQuantity || 0}
                onChange={onChange}
                style={{paddingBottom: '1rem'}}
              >
                {certainties.map(certainty => {
                 return ( <MenuItem
                    key={certainty}
                    value={certainty}
                  >
                    {<FormattedMessage id={`certainty${certainty}`} />}
                  </MenuItem> );
                })}
              </Select>
            )}
            {!mobileLayout && (
              <RadioGroup
                aria-labelledby="add-vote-certainty"
                className={classes.certaintyGroup}
                onChange={onChange}
                value={newQuantity || 0}
              >
                {certainties.map(certainty => {
                  return (
                    <FormControlLabel
                      key={certainty}
                      id={`${isInbox ? 'inbox' : ''}${certainty}`}
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
            )}
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
      </Card>
      <div style={{paddingBottom: '1rem'}}/>
      <WizardStepButtons
        {...wizardProps}
        showNext={true}
        showTerminate={true}
        onNext={mySave}
        terminateLabel="DecideWizardContinue"
        nextLabel={voteId}
      />
    </React.Fragment>
  );
}

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
