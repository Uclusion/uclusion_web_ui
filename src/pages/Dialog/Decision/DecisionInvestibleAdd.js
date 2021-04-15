import React, { useContext, } from 'react'
import PropTypes from 'prop-types'
import { Card, CardActions, CardContent, TextField, } from '@material-ui/core'
import { addDecisionInvestible, addInvestibleToStage } from '../../../api/investibles';
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
import { editorReset, useEditor } from '../../../components/TextEditors/quillHooks';

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
    description,
    name
  } = pageState;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const [marketStagesState] = useContext(MarketStagesContext);
  const marketStages = getStages(marketStagesState, marketId) || [];
  const investmentAllowedStage = marketStages.find((stage) => stage.allows_investment) || {};
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [, marketPresenceDispatch] = useContext(MarketPresencesContext);
  const [, marketDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);

  const editorName = `${marketId}-newInvestible`;
  const editorSpec = {
    onUpload: (files) => pageStateUpdate({uploadedFiles: files}),
    marketId,
    cssId: 'description',
    onChange: (contents) => pageStateUpdate({description: contents}),
    dontManageState: true, // handled by the page
    placeholder: intl.formatMessage({ id: 'investibleAddDescriptionDefault'})
  };
  const [Editor, editorController] = useEditor(editorName, editorSpec);

  function handleCancel() {
    pageStateReset();
    editorController(editorReset());
    onCancel();
  }

  function handleNewInlineSave(completionFunc) {
    const currentUploadedFiles = uploadedFiles || [];
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(currentUploadedFiles, description);
    const addDialogInfo = {
      name: 'NA',
      market_type: DECISION_TYPE,
      description: 'NA',
      parent_comment_id: parentCommentId,
    };
    return createDecision(addDialogInfo).then((result) => {
      addMarket(result, marketDispatch, diffDispatch, marketPresenceDispatch);
      const { market, stages, parent } = result;
      addCommentToMarket(parent, commentState, commentDispatch);
      const allowsInvestment = stages.find((stage) => stage.allows_investment);
      const processedDescription = tokensRemoved ? tokensRemoved : ' ';
      const addInfo = {
        marketId: market.id,
        uploadedFiles: filteredUploads,
        description: processedDescription,
        name,
        stageId: allowsInvestment.id,
      };
      return addInvestibleToStage(addInfo);
    }).then((investible) => {
      onSave(investible);
      editorController(editorReset());
    }).then(() => {
      if (typeof completionFunc === 'function') {
        completionFunc();
      } else {
        pageStateReset();
        editorController(editorReset());
        onSpinComplete();
      }
      setOperationRunning(false);
    });
  }

  function handleSaveAddAnother() {
    setOperationRunning(true);
    if (parentCommentId) {
      return handleNewInlineSave(onSaveAddAnother);
    }
    return handleSave(onSaveAddAnother);
  }

  function handleSave(completionFunc) {
    setOperationRunning(true);
    if (parentCommentId) {
      return handleNewInlineSave(completionFunc);
    }
    const currentUploadedFiles = uploadedFiles || [];
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(currentUploadedFiles, description);
    const processedDescription = tokensRemoved ? tokensRemoved : ' ';
    const addInfo = {
      marketId,
      uploadedFiles: filteredUploads,
      description: processedDescription,
      name,
      stageId: investmentAllowedStage.id, // ignored by addDecisionInvestible
    };
    const promise = isAdmin ? addInvestibleToStage(addInfo) : addDecisionInvestible(addInfo);
    return promise.then((investible) => {
      onSave(investible);
      editorController(editorReset());
    }).then(() => {
      setOperationRunning(false);
      if (typeof completionFunc === 'function') {
        completionFunc();
      } else {
        pageStateReset();
        editorController(editorReset());
        onSpinComplete();
      }
    });
  }

  function onSaveAddAnother() {
    pageStateReset();
    editorController(editorReset());
    pageStateUpdate({investibleAddBeingEdited: true});
  }

  return (
    <Card className={classes.overflowVisible}>
      <CardContent>
        <TextField
          fullWidth
          id="decision-investible-name"
          label={intl.formatMessage({ id: "agilePlanFormTitleLabel" })}
          onChange={(event) => {
            const { value } = event.target;
            pageStateUpdate({ name: value });
          }}
          placeholder={intl.formatMessage({
            id: "optionTitlePlaceholder"
          })}
          value={name}
          variant="filled"
        />
        {Editor}
      </CardContent>
      <CardActions className={classes.actions} style={{marginLeft: '1rem', paddingBottom: '1rem'}}>
        <SpinningIconLabelButton onClick={handleCancel} doSpin={false} icon={Clear}>
          {intl.formatMessage({ id: 'marketAddCancelLabel' })}
        </SpinningIconLabelButton>
        <SpinningIconLabelButton onClick={handleSave} icon={SettingsBackupRestore}
                                 disabled={!name || (!parentCommentId && !investmentAllowedStage.id)}>
          {intl.formatMessage({ id: 'agilePlanFormSaveLabel' })}
        </SpinningIconLabelButton>
        <SpinningIconLabelButton onClick={handleSaveAddAnother} icon={SettingsBackupRestore}
                                 disabled={!name || (!parentCommentId && !investmentAllowedStage.id)}>
          {intl.formatMessage({ id: 'decisionInvestibleSaveAddAnother' })}
        </SpinningIconLabelButton>
      </CardActions>
    </Card>

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
