import React, { useContext, useState } from 'react'
import { useIntl } from 'react-intl'
import { getQuillStoredState } from '../../../components/TextEditors/Utilities/CoreUtils'
import { useEditor } from '../../../components/TextEditors/quillHooks'
import { getPageReducerPage, usePageStateReducer } from '../../../components/PageState/pageStateHooks'
import { clearNameStoredState, getNameStoredState } from '../../../components/TextFields/NameField'
import AddNewUsers from '../../Dialog/UserManagement/AddNewUsers'
import { Typography } from '@material-ui/core'
import { processTextAndFilesForSave } from '../../../api/files'
import { nameFromDescription } from '../../../utils/stringFunctions'
import _ from 'lodash'
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions'
import { createUnnamedMarket } from '../../../api/markets'
import { addMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { addInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import TokenStorageManager, { TOKEN_TYPE_MARKET } from '../../../authorization/TokenStorageManager'
import { inviteParticipants } from '../../../api/users'
import { addMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesContextReducer'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { useHistory } from 'react-router'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Clear, Send } from '@material-ui/icons'
import IssueDialog from '../../../components/Warnings/IssueDialog'
import { useLockedDialogStyles } from '../../Dialog/DialogBodyEdit'
import { UNNAMED_SUB_TYPE } from '../../../constants/markets'

function InboxWelcomeExpansion() {
  const intl = useIntl();
  const history = useHistory();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const lockedDialogClasses = useLockedDialogStyles();
  const [openIssue, setOpenIssue] = useState(false);
  const [investibleAddStateFull, investibleAddDispatch] = usePageStateReducer('investibleAdd');
  const [investibleAddState, updateInvestibleAddState, investibleAddStateReset] =
    getPageReducerPage(investibleAddStateFull, investibleAddDispatch, 'inbox');
  const {
    emailList,
    uploadedFiles
  } = investibleAddState;

  function onS3Upload(metadatas) {
    updateInvestibleAddState({uploadedFiles: metadatas})
  }
  const editorName = 'planning-inv-add';
  const nameId = 'inboxAddInvestible';
  const editorSpec = {
    placeholder: intl.formatMessage({ id: 'investibleAddDescriptionDefault' }),
    onUpload: onS3Upload,
    value: getQuillStoredState(editorName)
  }
  const [Editor, resetMainEditor] = useEditor(editorName, editorSpec);

  function clear() {
    setOperationRunning(false);
    setOpenIssue(false);
    investibleAddStateReset();
    resetMainEditor();
  }

  function handleCancel() {
    clear();
  }

  function handleSave() {
    const emails = emailList ? emailList.split(',') : [];
    const emailArray = [];
    emails.forEach((email) => {
      const emailTrimmed = email.trim();
      emailArray.push({ email: emailTrimmed });
    });
    if (_.isEmpty(emailArray)) {
      setOperationRunning(false);
      setOpenIssue('noParticipants');
      return;
    }
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, getQuillStoredState(editorName));
    const processedDescription = tokensRemoved ? tokensRemoved : ' ';
    const addInfo = {
      uploaded_files: filteredUploads,
      description: processedDescription
    };
    const name = getNameStoredState(nameId);
    if (name) {
      addInfo.name = name;
    } else {
      addInfo.name = nameFromDescription(getQuillStoredState(editorName));
    }
    if (_.isEmpty(addInfo.name)) {
      setOperationRunning(false);
      setOpenIssue('noName');
      return;
    }
    return createUnnamedMarket(addInfo).then((result) => {
      const { market: { id: marketId }, token, investible } = result;
      addMarket(result, marketsDispatch, () => {}, marketPresencesDispatch);
      addInvestible(investiblesDispatch, () => {}, investible);
      const link = formInvestibleLink(marketId, investible.investible.id);
      const tokenStorageManager = new TokenStorageManager();
      return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, marketId, token)
        .then(() => inviteParticipants(marketId, emailArray, UNNAMED_SUB_TYPE, name))
        .then((result) => {
          marketPresencesDispatch(addMarketPresences(marketId, result));
          clear();
          clearNameStoredState(nameId);
          return navigate(history, link);
        });
    });
  }

  return (
    <div style={{paddingTop: '1.5rem', paddingLeft: '1rem', paddingRight: '1rem', paddingBottom: '1rem'}}>
      <Typography variant="body1" style={{fontWeight: 600, marginBottom: '1rem'}}>
        For approval and review of a job assigned to you use the below form. For jobs
        assigned to multiple collaborators, create a channel using + Channel from the left nav.
      </Typography>
      <AddNewUsers isInbox setEmailList={(value) => updateInvestibleAddState({emailList: value})}
                   emailList={emailList} />
      {Editor}
      <div style={{paddingTop: '1rem'}}>
        <SpinningIconLabelButton onClick={handleCancel} doSpin={false} icon={Clear}>
          {intl.formatMessage({ id: 'marketAddCancelLabel' })}
        </SpinningIconLabelButton>
        <SpinningIconLabelButton onClick={handleSave} icon={Send} id="inboxPlanningInvestibleAddButton">
          {intl.formatMessage({ id: 'commentAddSendLabel' })}
        </SpinningIconLabelButton>
        {openIssue !== false && (
          <IssueDialog
            classes={lockedDialogClasses}
            open={openIssue !== false}
            onClose={() => setOpenIssue(false)}
            issueWarningId={openIssue}
            showDismiss={false}
          />
        )}
      </div>
    </div>
  );
}

export default InboxWelcomeExpansion;