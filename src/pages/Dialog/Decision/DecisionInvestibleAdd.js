import React, { useContext, useState, } from 'react'
import PropTypes from 'prop-types'
import { Card, CardActions, CardContent, TextField, } from '@material-ui/core'
import localforage from 'localforage'
import { addDecisionInvestible, addInvestibleToStage } from '../../../api/investibles'
import QuillEditor from '../../../components/TextEditors/QuillEditor'
import { processTextAndFilesForSave } from '../../../api/files'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import {
  urlHelperGetName,
} from '../../../utils/marketIdPathFunctions'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { DECISION_TYPE } from '../../../constants/markets'
import { useIntl } from 'react-intl'
import { createDecision } from '../../../api/markets'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { addMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { addCommentToMarket } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'

function DecisionInvestibleAdd(props) {
  const {
    marketId,
    onCancel,
    isAdmin,
    onSave,
    storedState,
    onSpinComplete,
    parentCommentId
  } = props;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const { description: storedDescription, name: storedName } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const [marketStagesState] = useContext(MarketStagesContext);
  const marketStages = getStages(marketStagesState, marketId) || [];
  const investmentAllowedStage = marketStages.find((stage) => stage.allows_investment) || {};
  const emptyInvestible = { name: storedName || '', description: storedDescription };
  const [currentValues, setCurrentValues] = useState(emptyInvestible);
  const defaultClearFunc = () => {};
  //see https://stackoverflow.com/questions/55621212/is-it-possible-to-react-usestate-in-react for why we have a func
  // that returns  func for editorClearFunc
  const [editorClearFunc, setEditorClearFunc] = useState(() => defaultClearFunc);
  const [description, setDescription] = useState(storedDescription);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { name } = currentValues;
  const [, marketPresenceDispatch] = useContext(MarketPresencesContext);
  const [marketState, marketDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);

  const itemKey = `add_investible_${parentCommentId || marketId}`;
  function handleDraftState(newDraftState) {
    setDraftState(newDraftState);
    localforage.setItem(itemKey, newDraftState);
  }
  function handleChange(field) {
    return (event) => {
      const { value } = event.target;
      const newValues = { ...currentValues, [field]: value };
      setCurrentValues(newValues);
      handleDraftState({ ...draftState, [field]: value });
    };
  }


  function onEditorChange(description) {
    setDescription(description);
  }

  function onStorageChange(description) {
    localforage.getItem(itemKey).then((stateFromDisk) => {
      handleDraftState({ ...stateFromDisk, description });
    });
  }

  function onS3Upload(metadatas) {
    setUploadedFiles(metadatas);
  }

  function handleCancel() {
    localforage.removeItem(itemKey).then(() =>  onCancel());
  }

  function handleNewInlineSave(completionFunc) {
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, description);
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
      return localforage.removeItem(itemKey);
    }).then(() => {
      if (typeof completionFunc === 'function') {
        completionFunc();
      } else {
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
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, description);
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
      return localforage.removeItem(itemKey);
    }).then(() => {
      setOperationRunning(false);
      if (typeof completionFunc === 'function') {
        completionFunc();
      } else {
        onSpinComplete();
      }
    });
  }

  function onSaveAddAnother() {
    localforage.removeItem(itemKey)
      .finally(() => {
        setCurrentValues({ name: '' });
        editorClearFunc();
      });
  }

  return (
    <Card className={classes.overflowVisible}>
      <CardContent className={classes.cardContent}>
        <TextField
          fullWidth
          id="decision-investible-name"
          label={intl.formatMessage({ id: "agilePlanFormTitleLabel" })}
          onChange={handleChange('name')}
          placeholder={intl.formatMessage({
            id: "optionTitlePlaceholder"
          })}
          value={name}
          variant="filled"
        />
        <QuillEditor
          id="description"
          marketId={marketId}
          onChange={onEditorChange}
          onStoreChange={onStorageChange}
          placeholder={intl.formatMessage({ id: 'investibleAddDescriptionDefault' })}
          onS3Upload={onS3Upload}
          defaultValue={description}
          setOperationInProgress={setOperationRunning}
          setEditorClearFunc={(func) => {
            setEditorClearFunc(func);
          }}
          getUrlName={urlHelperGetName(marketState, investibleState)}
        />
      </CardContent>
      <CardActions className={classes.actions}>
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
  storedState: PropTypes.object.isRequired,
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
