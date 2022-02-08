import React, { useContext, useState, } from 'react'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { Card, CardActions, CardContent, useMediaQuery, useTheme, } from '@material-ui/core'
import { addDecisionInvestible } from '../../../api/investibles';
import { processTextAndFilesForSave } from '../../../api/files'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { DECISION_TYPE } from '../../../constants/markets'
import { useIntl } from 'react-intl'
import { createDecision } from '../../../api/markets'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { addMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { addCommentToMarket } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import { useEditor } from '../../../components/TextEditors/quillHooks';
import TokenStorageManager, { TOKEN_TYPE_MARKET } from '../../../authorization/TokenStorageManager'
import IssueDialog from '../../../components/Warnings/IssueDialog'
import { useLockedDialogStyles } from '../DialogBodyEdit'
import NameField, { clearNameStoredState, getNameStoredState } from '../../../components/TextFields/NameField'
import { nameFromDescription } from '../../../utils/stringFunctions'
import { getQuillStoredState } from '../../../components/TextEditors/Utilities/CoreUtils'

function DecisionInvestibleAdd(props) {
  const {
    marketId,
    onCancel,
    isAdmin,
    onSave,
    onSpinComplete,
    parentCommentId,
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
  const marketStages = getStages(marketStagesState, marketId) || [];
  const investmentAllowedStage = marketStages.find((stage) => stage.allows_investment) || {};
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, marketPresenceDispatch] = useContext(MarketPresencesContext);
  const [, marketDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);
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
    resetEditor();
    clearNameStoredState(nameId);
    onCancel();
  }

  function handleNewInlineSave(completionFunc) {
    const currentUploadedFiles = uploadedFiles || [];
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(currentUploadedFiles, getQuillStoredState(editorName));
    const addDialogInfo = {
      name: 'NA',
      market_type: DECISION_TYPE,
      description: 'NA',
      parent_comment_id: parentCommentId,
    };
    return createDecision(addDialogInfo).then((result) => {
      addMarket(result, marketDispatch, diffDispatch, marketPresenceDispatch);
      const { market, stages, parent, token } = result;
      addCommentToMarket(parent, commentState, commentDispatch);
      const allowsInvestment = stages.find((stage) => stage.allows_investment);
      const processedDescription = tokensRemoved ? tokensRemoved : ' ';
      const addInfo = {
        marketId: market.id,
        uploadedFiles: filteredUploads,
        description: processedDescription,
        stageId: allowsInvestment.id,
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
      const tokenStorageManager = new TokenStorageManager();
      return tokenStorageManager.storeToken(TOKEN_TYPE_MARKET, market.id, token)
        .then(() => addDecisionInvestible(addInfo));
    }).then((investible) => {
      onSave(investible);
      resetEditor();
      clearNameStoredState(nameId);
      if (typeof completionFunc === 'function') {
        completionFunc();
      } else {
        pageStateReset();
        onSpinComplete();
      }
      setOperationRunning(false);
    });
  }

  function handleSaveAddAnother() {
    if (parentCommentId) {
      return handleNewInlineSave(onSaveAddAnother);
    }
    return handleSave(onSaveAddAnother);
  }

  function handleSave(completionFunc) {
    if (parentCommentId) {
      return handleNewInlineSave(completionFunc);
    }
    const currentUploadedFiles = uploadedFiles || [];
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(currentUploadedFiles, getQuillStoredState(editorName));
    const processedDescription = tokensRemoved ? tokensRemoved : ' ';
    const addInfo = {
      marketId,
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
    resetEditor();
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
          <NameField id={nameId} descriptionFunc={() => getQuillStoredState(editorName)}
                     useCreateDefault placeHolder='optionTitlePlaceholder' />
          {Editor}
        </CardContent>
        <CardActions className={classes.actions} style={{marginLeft: '1rem', paddingBottom: '1rem'}}>
          <SpinningIconLabelButton onClick={handleCancel} doSpin={false} icon={Clear}>
            {!mobileLayout && intl.formatMessage({ id: 'marketAddCancelLabel' })}
          </SpinningIconLabelButton>
          <SpinningIconLabelButton onClick={handleSave} icon={SettingsBackupRestore}
                                   disabled={!parentCommentId && !investmentAllowedStage.id}
                                   id="decisionInvestibleSaveButton">
            {!mobileLayout && intl.formatMessage({ id: 'agilePlanFormSaveLabel' })}
          </SpinningIconLabelButton>
          <SpinningIconLabelButton onClick={handleSaveAddAnother} icon={SettingsBackupRestore}
                                   disabled={!parentCommentId && !investmentAllowedStage.id}
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
  parentCommentId: PropTypes.string,
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
