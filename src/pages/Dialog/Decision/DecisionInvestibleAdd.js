import React, { useContext, useEffect, useState, } from 'react'
import PropTypes from 'prop-types'
import { Button, Card, CardActions, CardContent, TextField, } from '@material-ui/core'
import localforage from 'localforage'
import { addDecisionInvestible, addInvestibleToStage } from '../../../api/investibles'
import QuillEditor from '../../../components/TextEditors/QuillEditor'
import { processTextAndFilesForSave } from '../../../api/files'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getStages } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import {
  formInvestibleLink,
  formMarketAddInvestibleLink,
  formMarketLink,
  navigate,
  urlHelperGetName,
} from '../../../utils/marketIdPathFunctions'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import CardType, { DECISION_TYPE, OPTION, VOTING_TYPE } from '../../../components/CardType'
import { FormattedMessage, useIntl } from 'react-intl'
import { createDecision } from '../../../api/markets'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { addParticipants } from '../../../api/users'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { useHistory } from 'react-router'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { addMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { addCommentToMarket } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'

function DecisionInvestibleAdd(props) {
  const {
    marketId,
    classes,
    onCancel,
    isAdmin,
    onSave,
    storedState,
    onSpinComplete,
    parentCommentId,
    inlineParentCommentId,
    parentInvestibleId,
    parentMarketId
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const [operationRunning] = useContext(OperationInProgressContext);
  const { description: storedDescription, name: storedName } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const [marketStagesState] = useContext(MarketStagesContext);
  const marketStages = getStages(marketStagesState, marketId) || [];
  const investmentAllowedStage = marketStages.find((stage) => stage.allows_investment) || {};
  const createdStage = marketStages.find((stage) => !stage.allows_investment) || {};
  const stageChangeInfo = {
    stage_id: investmentAllowedStage.id,
    current_stage_id: createdStage.id,
  };
  const emptyInvestible = { name: storedName || '', description: storedDescription };
  const [currentValues, setCurrentValues] = useState(emptyInvestible);
  const defaultClearFunc = () => {};
  //see https://stackoverflow.com/questions/55621212/is-it-possible-to-react-usestate-in-react for why we have a func
  // that returns  func for editorClearFunc
  const [editorClearFunc, setEditorClearFunc] = useState(() => defaultClearFunc);
  const [description, setDescription] = useState(storedDescription);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [validForm, setValidForm] = useState(false);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { name } = currentValues;
  const [marketPresencesState, marketPresenceDispatch] = useContext(MarketPresencesContext);
  const [marketState, marketDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [commentState, commentDispatch] = useContext(CommentsContext);

  useEffect(() => {
    // Long form to prevent flicker
    if (name) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, validForm]);

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
    let link = parentInvestibleId ? formInvestibleLink(parentMarketId, parentInvestibleId) : formMarketLink(marketId);
    if (parentCommentId || inlineParentCommentId) {
      link = `${link}#c${parentCommentId || inlineParentCommentId}`;
    }
    onCancel(link);
  }

  function handleNewInlineSave(isAddAnother) {
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
      const notAllowsInvestment = stages.find((stage) => !stage.allows_investment);
      const stageInfo = {
        stage_id: allowsInvestment.id,
        current_stage_id: notAllowsInvestment.id,
      };
      const processedDescription = tokensRemoved ? tokensRemoved : ' ';
      const addInfo = {
        marketId: market.id,
        uploadedFiles: filteredUploads,
        description: processedDescription,
        name,
        stageInfo: stageInfo,
      };
      const marketPresences = getMarketPresences(marketPresencesState, marketId);
      const others = marketPresences.filter((presence) => !presence.current_user && !presence.market_banned);
      if (others) {
        const participants = others.map((presence) => {
            return {
              user_id: presence.id,
              account_id: presence.account_id,
              is_observer: !presence.following
            };
        });
        return addParticipants(market.id, participants).then(() => addInvestibleToStage(addInfo));
      }
      return addInvestibleToStage(addInfo);
    }).then((investible) => {
      onSave(investible);
      if (isAddAnother) {
        const { market_infos } = investible;
        return {
          result: market_infos[0].market_id,
          spinChecker: () => Promise.resolve(true),
        };
      }
      const link = formInvestibleLink(parentMarketId, parentInvestibleId);
      return {
        result: link,
        spinChecker: () => Promise.resolve(true),
      };
    });
  }

  function handleSaveAddAnother() {
    if (parentCommentId) {
      return handleNewInlineSave(true);
    }
    return handleSave();
  }

  function handleSave() {
    if (parentCommentId) {
      return handleNewInlineSave(false);
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
      stageInfo: stageChangeInfo, // ignored by addDecisionInvestible
    };
    const promise = isAdmin ? addInvestibleToStage(addInfo) : addDecisionInvestible(addInfo);
    return promise.then((investible) => {
      // console.log('Adding investible to market');
      onSave(investible);
      const link = formMarketLink(marketId);
      return {
        result: link,
        //stop spinning immediately
        spinChecker: () => Promise.resolve(true),
      };
    });
  }

  function onSaveAddAnother(inlineMarketId) {
    localforage.removeItem(itemKey)
      .finally(() => {
        setCurrentValues({ name: '' });
        editorClearFunc();
      });
    if (parentCommentId) {
      navigate(history, formMarketAddInvestibleLink(inlineMarketId));
    }
  }

  return (
    <Card elevation={0} className={classes.overflowVisible}>
      <CardType
        className={classes.cardType}
        label={`${intl.formatMessage({
          id: "decisionInvestibleDescription"
        })}`}
        type={VOTING_TYPE}
        subtype={OPTION}
      />
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
        <Button
          onClick={handleCancel}
          disabled={operationRunning}
          className={classes.actionSecondary}
          color="secondary"
          variant="contained"
        >
          <FormattedMessage
            id={"marketAddCancelLabel"}
          />
        </Button>
        <SpinBlockingButton
          id="save"
          onClick={handleSave}
          onSpinStop={onSpinComplete}
          className={classes.actionPrimary}
          color="primary"
          disabled={!validForm || !stageChangeInfo.current_stage_id}
          hasSpinChecker
          marketId={marketId}
          variant="contained"
        >
          <FormattedMessage
            id={"agilePlanFormSaveLabel"}
          />
        </SpinBlockingButton>
        <SpinBlockingButton
          variant="contained"
          color="primary"
          disabled={!validForm || !stageChangeInfo.current_stage_id}
          id="saveAddAnother"
          onClick={handleSaveAddAnother}
          hasSpinChecker
          marketId={marketId}
          onSpinStop={onSaveAddAnother}
        >
          <FormattedMessage
            id="decisionInvestibleSaveAddAnother"
          />
        </SpinBlockingButton>
      </CardActions>
    </Card>

  );
}

DecisionInvestibleAdd.propTypes = {
  classes: PropTypes.object.isRequired,
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
