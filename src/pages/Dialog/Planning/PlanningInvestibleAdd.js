import React, { useContext, useState } from 'react'
import _ from 'lodash'
import { FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types'
import { Button, Card, CardActions, CardContent, Checkbox, FormControlLabel, } from '@material-ui/core'
import localforage from 'localforage'
import { addPlanningInvestible } from '../../../api/investibles'
import QuillEditor from '../../../components/TextEditors/QuillEditor'
import { processTextAndFilesForSave } from '../../../api/files'
import { formInvestibleLink, formMarketLink, urlHelperGetName } from '../../../utils/marketIdPathFunctions'
import AssignmentList from './AssignmentList'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { useLocation } from 'react-router';
import queryString from 'query-string'
import CardType, { STORY_TYPE, TODO_TYPE } from '../../../components/CardType'
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
import {
  getMarketComments,
  refreshMarketComments,
} from '../../../contexts/CommentsContext/commentsContextHelper'
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
import { moveComments } from '../../../api/comments'
import NameField from '../../../components/TextFields/NameField'
import Comment from '../../../components/Comments/Comment'
import { getAcceptedStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { assignedInStage } from '../../../utils/userFunctions'
import { getMarketInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'

function PlanningInvestibleAdd(props) {
  const {
    marketId, classes, onCancel, onSave, storedState, onSpinComplete, createdAt, storyMaxBudget, allowMultiVote,
    fromCommentIds, votesRequired
  } = props;
  const intl = useIntl();
  const [commentsState, commentsDispatch] = useContext(CommentsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const { description: storedDescription, name: storedName, assignments: storedAssignments, storedUrlAssignee,
    completion_estimate: storedDaysEstimate } = storedState;
  const [draftState, setDraftState] = useState(storedState);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const emptyInvestible = { name: storedName };
  const [currentValues, setCurrentValues] = useState(emptyInvestible);
  const comments = getMarketComments(commentsState, marketId) || [];
  const [description, setDescription] = useState(storedDescription);
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const location = useLocation();
  function getUrlAssignee() {
    const { hash } = location;
    if (!_.isEmpty(hash)) {
      const values = queryString.parse(hash);
      const { assignee } = values;
      if (assignee) {
        return [assignee];
      }
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
  const [daysEstimate, setDaysEstimate] = useState(storedDaysEstimate);
  const { name } = currentValues;
  const [marketState] = useContext(MarketsContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [presencesState] = useContext(MarketPresencesContext);
  const presences = getMarketPresences(presencesState, marketId) || [];
  const myPresence = presences.find((presence) => presence.current_user) || {};
  const isAssignedToMe = (assignments || []).includes(myPresence.id);
  const isAssigned = !_.isEmpty(assignments);
  const [quantity, setQuantity] = useState(50);
  const [maxBudget, setMaxBudget] = useState('');
  const [maxBudgetUnit, setMaxBudgetUnit] = useState('');
  const [skipApproval, setSkipApproval] = useState(false);
  const [reason, setReason] = useState('');
  const [, marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [tourState, tourDispatch] = useContext(TourContext);
  const isStoriesTourCompleted = isTourCompleted(tourState, INVITE_STORIES_WORKSPACE_FIRST_VIEW);
  const [userState, userDispatch] = useContext(AccountUserContext);
  const userPreferences = getUiPreferences(userState) || {};
  const tourPreferences = userPreferences.tours || {};
  const { completedTours } = tourPreferences;
  const safeCompletedTours = _.isArray(completedTours)? completedTours : [];
  const acceptedStage = getAcceptedStage(marketStagesState, marketId) || {};

  const itemKey = `add_investible_${marketId}`;
  function handleDraftState(newDraftState) {
    setDraftState(newDraftState);
    localforage.setItem(itemKey, newDraftState);
  }

  function handleNameStorage(value) {
    handleDraftState({ ...draftState, name: value });
  }

  function handleNameChange(value) {
    const newValues = { ...currentValues, name: value };
    setCurrentValues(newValues);
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

  function onUnitChange(event, value) {
    setMaxBudgetUnit(value);
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
    setDaysEstimate(value);
    handleDraftState({ ...draftState, completion_estimate: value });
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
    const processedDescription = tokensRemoved ? tokensRemoved : ' ';
    const addInfo = {
      marketId,
      uploadedFiles: filteredUploads,
      description: processedDescription,
      name
    };
    if (isAssigned) {
      addInfo.assignments = assignments;
    }
    if (daysEstimate) {
      addInfo.daysEstimate = daysEstimate;
    }
    if (skipApproval) {
      addInfo.stageId = acceptedStage.id;
    }
    return addPlanningInvestible(addInfo).then((inv) => {
      if (fromCommentIds) {
        const { investible } = inv;
        return moveComments(marketId, investible.id, fromCommentIds)
          .then((movedComments) => {
            const comments = getMarketComments(commentsState, marketId);
            refreshMarketComments(commentsDispatch, marketId, [...movedComments, ...comments]);
            return inv;
          });
      }
      return inv;
    }).then((inv) => {
      const { investible } = inv;
      onSave(inv);
      const link = formInvestibleLink(marketId, investible.id);
      if (isAssignedToMe || !isAssigned) {
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
        maxBudget,
        maxBudgetUnit
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

  function getAddedComments() {
    return (fromCommentIds || []).map((fromCommentId) => {
      const fromComment = comments.find((comment) => comment.id === fromCommentId);
      return (
        <div style={{marginTop: "2rem"}}>
          <Comment
            depth={0}
            marketId={marketId}
            comment={fromComment}
            comments={comments}
            allowedTypes={[TODO_TYPE]}
            readOnly
          />
        </div>
      );
    });
  }

  const assignedInAcceptedStage = assignedInStage(getMarketInvestibles(investibleState, marketId), myPresence.id,
    acceptedStage.id, marketId);
  const acceptedFull = acceptedStage.allowed_investibles > 0 && assignedInAcceptedStage.length >= acceptedStage.allowed_investibles;

  return (
    <>
      <DismissableText textId='planningInvestibleAddHelp' />
      <Card elevation={0} className={classes.overflowVisible}>
        <CardType
          className={classes.cardType}
          label={`${intl.formatMessage({
            id: "investibleDescription"
          })}`}
          type={STORY_TYPE}
        />
        <CardContent>
          <div className={classes.cardContent}>
            <AssignmentList
              marketId={marketId}
              onChange={onAssignmentsChange}
              previouslyAssigned={choosePreviouslyAssigned()}
            />
            <fieldset className={classes.fieldset}>
              <legend>optional</legend>
              <DaysEstimate onChange={onDaysEstimateChange} value={daysEstimate} createdAt={createdAt} />
              {isAssignedToMe && assignments.length === 1 && (
                <FormControlLabel
                  control={
                    <Checkbox
                      value={skipApproval}
                      disabled={votesRequired > 1 || acceptedFull || !acceptedStage.id}
                      checked={skipApproval}
                      onClick={() => setSkipApproval(!skipApproval)}
                    />
                  }
                  label={intl.formatMessage({ id: 'skipApprovalExplanation' })}
                />
              )}
            </fieldset>
          </div>
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
          <NameField onEditorChange={handleNameChange} onStorageChange={handleNameStorage} description={description}
                     name={name} useCreateDefault />
        </CardContent>
        {!isAssignedToMe && isAssigned && (
          <AddInitialVote
            marketId={marketId}
            storyMaxBudget={storyMaxBudget}
            onBudgetChange={onBudgetChange}
            onChange={onQuantityChange}
            onEditorChange={onReasonChange}
            newQuantity={quantity}
            onUnitChange={onUnitChange}
            maxBudget={maxBudget}
            maxBudgetUnit={maxBudgetUnit}
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
              disabled={!name}
              marketId={marketId}
              variant="contained"
            >
              <FormattedMessage
                id={"agilePlanFormSaveLabel"}
              />
            </SpinBlockingButton>
        </CardActions>
      </Card>
      {getAddedComments()}
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
  storyMaxBudget: PropTypes.number,
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
