import React, { useContext, useState, } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { Card, CardActions, CardContent, useMediaQuery, useTheme, } from '@material-ui/core'
import { addDecisionInvestible } from '../../../api/investibles';
import { processTextAndFilesForSave } from '../../../api/files'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useIntl } from 'react-intl'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import { useEditor } from '../../../components/TextEditors/quillHooks';
import IssueDialog from '../../../components/Warnings/IssueDialog'
import { useLockedDialogStyles } from '../DialogBodyEdit'
import NameField, { clearNameStoredState, getNameStoredState } from '../../../components/TextFields/NameField'
import { nameFromDescription } from '../../../utils/stringFunctions'
import { getQuillStoredState } from '../../../components/TextEditors/Utilities/CoreUtils'
import { findMessageOfType } from '../../../utils/messageUtils'
import { NOT_FULLY_VOTED_TYPE } from '../../../constants/notifications'
import {
  changeLevelMessage,
  dehighlightMessage
} from '../../../contexts/NotificationsContext/notificationsContextReducer'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'

function DecisionInvestibleAdd(props) {
  const {
    marketId,
    onCancel,
    isAdmin,
    onSave,
    onSpinComplete,
    pageState,
    pageStateUpdate,
    pageStateReset
  } = props;
  const {
    uploadedFiles,
  } = pageState;
  const nameId = `investibleAdd${marketId}`;
  const intl = useIntl();
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('xs'));
  const classes = usePlanFormStyles();
  const lockedDialogClasses = useLockedDialogStyles();
  const [marketStagesState] = useContext(MarketStagesContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const marketStages = getStages(marketStagesState, marketId) || [];
  const investmentAllowedStage = marketStages.find((stage) => stage.allows_investment) || {};
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [openIssue, setOpenIssue] = useState(false);

  const editorName = `${marketId}-newInvestible`;
  const editorSpec = {
    onUpload: (files) => pageStateUpdate({uploadedFiles: files}),
    marketId,
    cssId: 'description',
    value: getQuillStoredState(editorName),
    placeholder: intl.formatMessage({ id: 'investibleAddDescriptionDefault'})
  };
  const [Editor, resetEditor] = useEditor(editorName, editorSpec);

  function handleCancel() {
    pageStateReset();
    resetEditor('', {placeholder:
        intl.formatMessage({ id: 'investibleAddDescriptionDefault' })});
    clearNameStoredState(nameId);
    onCancel();
  }

  function handleSaveAddAnother() {
    return handleSave(onSaveAddAnother);
  }

  function handleSave(completionFunc) {
    const currentUploadedFiles = uploadedFiles || [];
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(currentUploadedFiles, getQuillStoredState(editorName));
    const processedDescription = tokensRemoved ? tokensRemoved : ' ';
    const addInfo = {
      marketId,
      groupId: marketId,
      uploadedFiles: filteredUploads,
      description: processedDescription,
    };
    const name = getNameStoredState(nameId);
    if (name) {
      addInfo.name = name;
    } else {
      addInfo.name = nameFromDescription(getQuillStoredState(editorName));
    }
    if (_.isEmpty(addInfo.name)) {
      setOperationRunning(false);
      setOpenIssue('nameRequired');
      return;
    }
    if (isAdmin) {
      addInfo.stageId = investmentAllowedStage.id;
    }
    return addDecisionInvestible(addInfo).then((investible) => {
      const notFullyVotedMessage = findMessageOfType(NOT_FULLY_VOTED_TYPE, marketId, messagesState);
      if (notFullyVotedMessage) {
        messagesDispatch(changeLevelMessage(notFullyVotedMessage, 'BLUE'));
        messagesDispatch(dehighlightMessage(notFullyVotedMessage));
      }
      onSave(investible);
      resetEditor();
      clearNameStoredState(nameId);
    }).then(() => {
      setOperationRunning(false);
      if (typeof completionFunc === 'function') {
        completionFunc();
      } else {
        pageStateReset();
        resetEditor();
        onSpinComplete();
      }
    });
  }

  function onSaveAddAnother() {
    pageStateReset();
    resetEditor('', {placeholder:
        intl.formatMessage({ id: 'investibleAddDescriptionDefault' })});
    pageStateUpdate({investibleAddBeingEdited: true});
  }

  return (
    <>
      {openIssue !== false && (
        <IssueDialog
          classes={lockedDialogClasses}
          open={openIssue !== false}
          onClose={() => setOpenIssue(false)}
          issueWarningId={openIssue}
          showDismiss={false}
        />
      )}
      <Card className={classes.overflowVisible}>
        <CardContent>
          <NameField id={nameId} editorName={editorName} useCreateDefault placeHolder="optionTitlePlaceholder"/>
          {Editor}
        </CardContent>
        <CardActions className={classes.actions} style={{marginLeft: '1rem', paddingBottom: '1rem'}}>
          <SpinningIconLabelButton onClick={handleCancel} doSpin={false} icon={Clear}>
            {!mobileLayout && intl.formatMessage({ id: 'marketAddCancelLabel' })}
          </SpinningIconLabelButton>
          <SpinningIconLabelButton onClick={handleSave} icon={SettingsBackupRestore}
                                   disabled={!investmentAllowedStage.id}
                                   id="decisionInvestibleSaveButton">
            {!mobileLayout && intl.formatMessage({ id: 'agilePlanFormSaveLabel' })}
          </SpinningIconLabelButton>
          <SpinningIconLabelButton onClick={handleSaveAddAnother} icon={SettingsBackupRestore}
                                   disabled={!investmentAllowedStage.id}
                                   id="decisionInvestibleSaveAddAnotherButton">
            {intl.formatMessage({ id: mobileLayout ? 'decisionInvestibleMobileAddAnother' :
                'decisionInvestibleSaveAddAnother' })}
          </SpinningIconLabelButton>
        </CardActions>
      </Card>
    </>
  );
}

DecisionInvestibleAdd.propTypes = {
  marketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
  isAdmin: PropTypes.bool,
  hidden: PropTypes.bool,
  onSpinComplete: PropTypes.func,
  inlineParentCommentId: PropTypes.string,
  parentInvestibleId: PropTypes.string,
  parentMarketId: PropTypes.string
};

DecisionInvestibleAdd.defaultProps = {
  onSave: () => {
  },
  onCancel: () => {
  },
  onSpinComplete: () => {},
  isAdmin: false,
  hidden: false,
};

export default DecisionInvestibleAdd;
