import React, { useContext, useEffect, useState } from 'react'
import _ from 'lodash'
import { FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import { Button, Card, CardActions, CardContent, TextField, } from '@material-ui/core'
import localforage from 'localforage'
import { addPlanningInvestible } from '../../../api/investibles'
import QuillEditor from '../../../components/TextEditors/QuillEditor'
import { processTextAndFilesForSave } from '../../../api/files'
import { formInvestibleLink, formMarketLink, urlHelperGetName } from '../../../utils/marketIdPathFunctions'
import AssignmentList from './AssignmentList'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useHistory } from 'react-router'
import queryString from 'query-string'
import CardType, { STORY_TYPE } from '../../../components/CardType'
import { DaysEstimate } from '../../../components/AgilePlan'
import DismissableText from '../../../components/Notifications/DismissableText'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import AddInitialVote from '../../Investible/Voting/AddInitialVote'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import {
  getMarketPresences,
  partialUpdateInvestment
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { updateInvestment } from '../../../api/marketInvestibles'
import { getMarketComments, refreshMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'
import { TourContext } from '../../../contexts/TourContext/TourContext'
import { AccountUserContext } from '../../../contexts/AccountUserContext/AccountUserContext'
import {
  completeTour,
  INVITE_STORIES_WORKSPACE_FIRST_VIEW,
  isTourCompleted
} from '../../../contexts/TourContext/tourContextHelper'
import { storeTourCompleteInBackend } from '../../../components/Tours/UclusionTour'
import { getUiPreferences } from '../../../contexts/AccountUserContext/accountUserContextHelper'

function PlanningInvestibleAdd(props) {
  const {
    marketId, classes, onCancel, onSave, storedState, onSpinComplete, createdAt, storyMaxBudget, allowMultiVote
  } = props;
  const intl = useIntl();
  const { description: storedDescription, name: storedName, assignments: storedAssignments, storedUrlAssignee,
    days_estimate: storedDaysEstimate } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const emptyInvestible = { name: storedName };
  const [currentValues, setCurrentValues] = useState(emptyInvestible);
  const [description, setDescription] = useState(storedDescription);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const history = useHistory();
  function getUrlAssignee() {
    const { location } = history;
    const { hash } = location;
    if (!_.isEmpty(hash)) {
      const values = queryString.parse(hash);
      const { assignee } = values;
      return [assignee];
    }
    return undefined;
  }
  function choosePreviouslyAssigned() {
    const urlAssignee = getUrlAssignee();
    if (storedAssignments && (!urlAssignee || storedUrlAssignee === urlAssignee)) {
      return storedAssignments;
    }
    return urlAssignee;
  }
  const [assignments, setAssignments] = useState(choosePreviouslyAssigned());
  const [validForm, setValidForm] = useState(false);
  const [daysEstimate, setDaysEstimate] = useState(storedDaysEstimate);
  const { name } = currentValues;
  const [marketState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [presencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(presencesState, marketId) || [];
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const isAssigned = (assignments || []).includes(myPresence.id);
  const [quantity, setQuantity] = useState(50);
  const [maxBudget, setMaxBudget] = useState('');
  const [reason, setReason] = useState('');
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [tourState, tourDispatch] = useContext(TourContext);
  const isStoriesTourCompleted = isTourCompleted(tourState, INVITE_STORIES_WORKSPACE_FIRST_VIEW);
  const [userState, userDispatch] = useContext(AccountUserContext);
  const userPreferences = getUiPreferences(userState) || {};
  const tourPreferences = userPreferences.tours || {};
  const { completedTours } = tourPreferences;
  const safeCompletedTours = _.isArray(completedTours)? completedTours : [];

  useEffect(() => {
    // Long form to prevent flicker
    if (name && !_.isEmpty(description) && !_.isEmpty(assignments) && (isAssigned ||
      (maxBudget > 0 && maxBudget <= storyMaxBudget))) {
      if (!validForm) {
        setValidForm(true);
      }
    } else if (validForm) {
      setValidForm(false);
    }
  }, [name, description, assignments, validForm, isAssigned, maxBudget, storyMaxBudget]);

  const itemKey = `add_investible_${marketId}`;
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

  function onQuantityChange(event) {
    const { value } = event.target;
    setQuantity(parseInt(value, 10));
  }

  function onBudgetChange(event) {
    const { value } = event.target;
    if (value) {
      setMaxBudget(parseInt(value, 10));
    } else {
      setMaxBudget('');
    }
  }

  function onReasonChange(body) {
    setReason(body);
  }

  function onAssignmentsChange(newAssignments) {
    setAssignments(newAssignments);
    handleDraftState({ ...draftState, assignments: newAssignments, storedUrlAssignee: getUrlAssignee() });
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

  function zeroCurrentValues() {
    setCurrentValues(emptyInvestible);
    setDescription('');
  }

  function handleCancel() {
    zeroCurrentValues();
    onCancel(formMarketLink(marketId));
  }

  function onDaysEstimateChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    setDaysEstimate(valueInt);
    handleDraftState({ ...draftState, days_estimate: valueInt });
  }

  function handleSave() {
    if (!isStoriesTourCompleted) {
      // If you are adding a story by yourself we don't want to force a story tour on you
      completeTour(tourDispatch, INVITE_STORIES_WORKSPACE_FIRST_VIEW);
      storeTourCompleteInBackend(INVITE_STORIES_WORKSPACE_FIRST_VIEW, safeCompletedTours, tourPreferences,
        userPreferences, userDispatch);
    }
    const {
      uploadedFiles: filteredUploads,
      text: tokensRemoved,
    } = processTextAndFilesForSave(uploadedFiles, description);
    const addInfo = {
      marketId,
      uploadedFiles: filteredUploads,
      description: tokensRemoved,
      name,
      assignments,
    };
    if (daysEstimate) {
      addInfo.daysEstimate = daysEstimate;
    }
    return addPlanningInvestible(addInfo).then((inv) => {
      const { investible } = inv;
      onSave(inv);
      const link = formInvestibleLink(marketId, investible.id);
      if (isAssigned) {
        return {
          result: link,
          spinChecker: () => Promise.resolve(true),
        };
      }
      const updateInfo = {
        marketId,
        investibleId: investible.id,
        newQuantity: quantity,
        currentQuantity: 0,
        newReasonText: reason,
        reasonNeedsUpdate: !_.isEmpty(reason),
        maxBudget
      };
      return updateInvestment(updateInfo).then(result => {
        const { commentResult, investmentResult } = result;
        const { commentAction, comment } = commentResult;
        if (commentAction !== "NOOP") {
          const comments = getMarketComments(commentsState, marketId);
          refreshMarketComments(commentsDispatch, marketId, [comment, ...comments]);
        }
        partialUpdateInvestment(marketPresencesDispatch, investmentResult, allowMultiVote);
        return {
          result: link,
          spinChecker: () => Promise.resolve(true),
        };
      });
    });
  }

  return (
    <>
      <DismissableText textId='planningInvestibleAddHelp' />
      <Card elevation={0}>
        <CardType
          className={classes.cardType}
          label={`${intl.formatMessage({
            id: "investibleDescription"
          })}`}
          type={STORY_TYPE}
        />
        <CardContent className={classes.cardContent}>
          <AssignmentList
            marketId={marketId}
            onChange={onAssignmentsChange}
            previouslyAssigned={choosePreviouslyAssigned()}
          />
          <fieldset className={classes.fieldset}>
            <legend>optional</legend>
            <DaysEstimate onChange={onDaysEstimateChange} value={daysEstimate} createdAt={createdAt} />
          </fieldset>
          <TextField
            fullWidth
            id="plan-investible-name"
            label={intl.formatMessage({ id: "agilePlanFormTitleLabel" })}
            onChange={handleChange('name')}
            placeholder={intl.formatMessage({
              id: "storyTitlePlaceholder"
            })}
            value={name}
            variant="filled"
          />
          <QuillEditor
            marketId={marketId}
            onChange={onEditorChange}
            onStoreChange={onStorageChange}
            placeholder={intl.formatMessage({ id: 'investibleAddDescriptionDefault' })}
            onS3Upload={onS3Upload}
            defaultValue={description}
            setOperationInProgress={setOperationRunning}
            getUrlName={urlHelperGetName(marketState, investibleState)}
          />
        </CardContent>
        {!isAssigned && (
          <AddInitialVote
            marketId={marketId}
            storyMaxBudget={storyMaxBudget}
            onBudgetChange={onBudgetChange}
            onChange={onQuantityChange}
            onEditorChange={onReasonChange}
            newQuantity={quantity}
            maxBudget={maxBudget}
            body={reason}
          />
        )}
        <CardActions className={classes.actions}>
            <Button
              className={classes.actionSecondary}
              color="secondary"
              variant="contained"
              onClick={handleCancel}
            >
              <FormattedMessage
                id={"marketAddCancelLabel"}
              />
            </Button>
            <SpinBlockingButton
              onClick={handleSave}
              hasSpinChecker
              onSpinStop={onSpinComplete}
              className={classes.actionPrimary}
              color="primary"
              disabled={!validForm}
              marketId={marketId}
              variant="contained"
            >
              <FormattedMessage
                id={"agilePlanFormSaveLabel"}
              />
            </SpinBlockingButton>
        </CardActions>
      </Card>
    </>
  );
}

PlanningInvestibleAdd.propTypes = {
  classes: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSpinComplete: PropTypes.func,
  onSave: PropTypes.func,
  marketPresences: PropTypes.arrayOf(PropTypes.object).isRequired,
  storedState: PropTypes.object.isRequired,
  storyMaxBudget: PropTypes.number.isRequired,
  allowMultiVote: PropTypes.bool.isRequired
};

PlanningInvestibleAdd.defaultProps = {
  onSave: () => {
  },
  onSpinComplete: () => {},
  onCancel: () => {
  },
};

export default PlanningInvestibleAdd;
