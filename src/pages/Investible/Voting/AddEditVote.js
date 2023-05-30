import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { FormattedMessage, useIntl } from 'react-intl';
import {
  darken,
  FormControl,
  FormControlLabel,
  makeStyles,
  MenuItem,
  Radio,
  RadioGroup,
  Select,
  useMediaQuery,
  useTheme
} from '@material-ui/core';
import { updateInvestment } from '../../../api/marketInvestibles';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { useEditor } from '../../../components/TextEditors/quillHooks';
import { processTextAndFilesForSave } from '../../../api/files';
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
    marketId,
    investibleId,
    groupId,
    multiplier, wizardProps, hasVoted, currentReasonId,
    formData, updateFormData, voteMessage, isInbox
  } = props;
  const {
    approveQuantity,
    uploadedFiles,
    originalQuantity,
    originalReason
  } = formData;
  const intl = useIntl();
  const classes = useStyles();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, messagesDispatch] = useContext(NotificationsContext);

  const editorName = getEditVoteEditorName(investibleId, isInbox);
  const editorSpec = {
    marketId,
    placeholder: intl.formatMessage({ id: 'yourReason' }),
    value: getQuillStoredState(editorName) || originalReason,
    onUpload: (files) => updateFormData({uploadedFiles: files})
  };
  const [Editor, resetEditor] = useEditor(editorName, editorSpec);

  function mySave(isSwitch) {
    const currentUploadedFiles = uploadedFiles || [];
    const myBodyNow = getQuillStoredState(editorName);
    const userMultiplier = isSwitch ? multiplier*-1 : multiplier;
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(currentUploadedFiles, myBodyNow);
    const reasonText =  tokensRemoved !== null ? tokensRemoved : originalReason;
    // don't include reason text if it's not changing, otherwise we'll update the reason comment
    const reasonNeedsUpdate = reasonText !== originalReason && !(_.isEmpty(reasonText) && _.isEmpty(originalReason));
    const updateInfo = {
      marketId,
      investibleId,
      groupId,
      newQuantity: approveQuantity*userMultiplier,
      currentQuantity: originalQuantity,
      newReasonText: reasonText,
      currentReasonId,
      reasonNeedsUpdate,
      uploadedFiles: filteredUploads
    };

    return updateInvestment(updateInfo).then(result => {
      resetEditor('', {placeholder: intl.formatMessage({ id: 'yourReason' })});
      commonQuick(result, commentsDispatch, marketId, commentsState, marketPresencesDispatch, undefined,
        messagesDispatch, setOperationRunning, voteMessage);
    });
  }

  function onChange(event) {
    const { value } = event.target;
    updateFormData({approveQuantity: parseInt(value, 10)});
    focusEditor(editorName);
  }

  const voteId = hasVoted ? (multiplier < 0 ? 'keepReject' : 'keepFor') : (multiplier < 0 ? "saveReject" : "saveVote");
  const otherVoteId = multiplier < 0 ? "switchToFor" : "switchToReject";
  const certainties = [5, 25, 50, 75, 100];
  return (
    <React.Fragment>
      <div style={{paddingBottom: '1rem'}}>
          <FormControl className={classes.certainty}>
            {mobileLayout && (
              <Select
                value={approveQuantity}
                onChange={onChange}
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
            {mobileLayout && (
              <div style={{marginBottom: '1rem'}}/>
            )}
            {!mobileLayout && (
              <RadioGroup
                aria-labelledby="add-vote-certainty"
                className={classes.certaintyGroup}
                onChange={onChange}
                value={approveQuantity}
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
          {Editor}
      </div>
      <WizardStepButtons
        {...wizardProps}
        showNext={true}
        showTerminate={!isInbox || voteMessage.is_highlighted}
        onNext={mySave}
        showOtherNext={hasVoted}
        onOtherNext={() => mySave(true)}
        otherNextLabel={otherVoteId}
        terminateLabel={isInbox ? "defer" : "InitiativeCommmentWizardTerminate"}
        nextLabel={voteId}
      />
    </React.Fragment>
  );
}

AddEditVote.propTypes = {
  reason: PropTypes.object,
  marketId: PropTypes.string.isRequired,
  investibleId: PropTypes.string.isRequired,
  investment: PropTypes.object,
  onSave: PropTypes.func,
  hasVoted: PropTypes.bool,
  allowMultiVote: PropTypes.bool,
  multiplier: PropTypes.number,
};

AddEditVote.defaultProps = {
  hasVoted: false,
  allowMultiVote: true,
  investment: {},
  onSave: () => {},
  multipler: 1,
};

export default AddEditVote;
