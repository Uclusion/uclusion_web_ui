import React, { useContext, useState } from 'react'
import { Button, Card, CardActions, CardContent, } from '@material-ui/core'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { updateInvestible } from '../../../api/investibles'
import { getMarketInfo } from '../../../utils/userFunctions'
import AssignmentList from '../../Dialog/Planning/AssignmentList'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import CardType, {
  ASSIGN_TYPE,
  STORY_TYPE,
  ISSUE_TYPE,
  QUESTION_TYPE,
  SUGGEST_CHANGE_TYPE
} from '../../../components/CardType'
import { FormattedMessage, useIntl } from 'react-intl'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import BlockIcon from '@material-ui/icons/Block'
import WarningDialog from '../../../components/Warnings/WarningDialog'
import { useLockedDialogStyles } from '../../Dialog/DialogBodyEdit'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { makeStyles } from '@material-ui/core/styles'
import {
  getBlockedStage,
  getInCurrentVotingStage, getRequiredInputStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { getMarketComments } from '../../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext'

export const usePlanInvestibleStyles = makeStyles(
  theme => ({
    fieldset: {
      border: "none",
      margin: theme.spacing(1),
      maxWidth: "400px"
    },
  }),
  { name: "PlanningInvestibleEdit" }
);

function PlanningInvestibleEdit(props) {
  const {
    fullInvestible, onCancel, onSave, marketId, isAssign, isApprove, isReview
  } = props;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const lockedDialogClasses = useLockedDialogStyles();
  const myInvestible = fullInvestible.investible;
  const marketInfo = getMarketInfo(fullInvestible, marketId) || {};
  const { assigned: marketAssigned, required_approvers: requiredApprovers,
    required_reviews: requiredReviewers } = marketInfo;
  const initialAssigned = (isAssign ? marketAssigned : isReview ? requiredReviewers : requiredApprovers) || [];
  const [assignments, setAssignments] = useState(initialAssigned);
  const [open, setOpen] = useState(false);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState] = useContext(CommentsContext);
  const hasVotes = marketPresences.find(presence => {
    const { investments } = presence;
    if (_.isEmpty(investments)) {
      return false;
    }
    let found = false;
    investments.forEach(investment => {
      const { investible_id: invId } = investment;
      if (invId === myInvestible.id) {
        found = true;
      }
    });
    return found;
  });
  const validForm = Array.isArray(assignments) && assignments.length > 0;

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  function handleSave() {
    const updateInfo = {
      marketId,
      investibleId: myInvestible.id
    };
    if (isAssign) {
      updateInfo.assignments = assignments;
    }
    if (isReview) {
      updateInfo.requiredReviewers = assignments;
    }
    if (isApprove) {
      updateInfo.requiredApprovers = assignments;
    }
    const assignmentChanged = !_.isEmpty(_.xor(assignments, initialAssigned));
    if (assignmentChanged) {
      return updateInvestible(updateInfo)
        .then((investible) => {
          let fullInvestible = investible;
          if (isAssign) {
            const comments = getMarketComments(commentsState, marketId);
            // Changing assignment moves to in voting, blocked or requires input
            const unresolvedComments = comments.filter(comment => comment.investible_id === myInvestible.id &&
              !comment.resolved);
            const blockingComments = unresolvedComments.filter(comment => comment.comment_type === ISSUE_TYPE);
            const requiresInputComments = unresolvedComments.filter(comment => (comment.comment_type === QUESTION_TYPE ||
              comment.comment_type === SUGGEST_CHANGE_TYPE) && assignments.includes(comment.created_by));
            const newStage = _.isEmpty(blockingComments) ? _.isEmpty(requiresInputComments) ?
              getInCurrentVotingStage(marketStagesState, marketId) : getRequiredInputStage(marketStagesState, marketId)
              : getBlockedStage(marketStagesState, marketId);
            const { market_infos, investible: rootInvestible } = fullInvestible;
            const [info] = (market_infos || []);
            const newInfo = {
              ...info,
              stage: newStage.id,
              stage_name: newStage.name,
              open_for_investment: newStage.allows_investment,
              last_stage_change_date: Date.now().toString(),
            };
            const newInfos = _.unionBy([newInfo], market_infos, 'id');
            fullInvestible = {
              investible: rootInvestible,
              market_infos: newInfos
            };
          }
          return {
            result: { fullInvestible, assignmentChanged },
            spinChecker: () => Promise.resolve(true),
          };
        });
    }
  }
  function handleAssignmentChange(newAssignments) {
    setAssignments(newAssignments);
  }
  const operationLabel = isAssign ? "investibleAssign" : isReview ? "investibleReviewers" : "investibleApprovers";
  const subtype = ASSIGN_TYPE;
  if (isReview || isApprove) {
    return (
      <Card elevation={0} className={classes.overflowVisible}>
        <CardType
          className={classes.cardType}
          label={intl.formatMessage({ id: operationLabel })}
          type={STORY_TYPE}
          subtype={subtype}
        />
        <CardContent>
          <div className={classes.cardContent}>
            <AssignmentList
              marketId={marketId}
              previouslyAssigned={initialAssigned}
              cannotBeAssigned={marketAssigned}
              onChange={handleAssignmentChange}
              listHeader={isReview ? 'reviewListHeader' : 'approveListHeader'}
            />
          </div>
        </CardContent>
        <CardActions className={classes.actions}>
          <Button
            className={classes.actionSecondary}
            color="secondary"
            variant="contained"
            onClick={onCancel}
          >
            <FormattedMessage
              id={"marketAddCancelLabel"}
            />
          </Button>
          <SpinBlockingButton
            marketId={marketId}
            variant="contained"
            color="primary"
            className={classes.actionPrimary}
            onClick={handleSave}
            disabled={_.isEmpty(_.xor(assignments, initialAssigned))}
            onSpinStop={onSave}
            hasSpinChecker
          >
            <FormattedMessage
              id={"agilePlanFormSaveLabel"}
            />
          </SpinBlockingButton>
        </CardActions>
      </Card>
    );
  }

  return (
    <Card elevation={0} className={classes.overflowVisible}>
      <CardType
        className={classes.cardType}
        label={intl.formatMessage({ id: operationLabel })}
        type={STORY_TYPE}
        subtype={subtype}
      />
      <CardContent>
        <div className={classes.cardContent}>
          <AssignmentList
            marketId={marketId}
            previouslyAssigned={initialAssigned}
            onChange={handleAssignmentChange}
          />
        </div>
      </CardContent>
      <CardActions className={classes.actions}>
        <Button
          className={classes.actionSecondary}
          color="secondary"
          variant="contained"
          onClick={onCancel}
        >
          <FormattedMessage
            id={"marketAddCancelLabel"}
          />
        </Button>
        {hasVotes && (
          <Button
            className={classes.actionPrimary}
            color="primary"
            variant="contained"
            onClick={handleOpen}
          >
            <FormattedMessage
              id={"agilePlanFormSaveLabel"}
            />
          </Button>
        )}
        {hasVotes && (
          <WarningDialog
            classes={lockedDialogClasses}
            open={open}
            onClose={handleClose}
            icon={<BlockIcon/>}
            issueWarningId="reassignWarning"
            /* slots */
            actions={
              <SpinBlockingButton
                marketId={marketId}
                variant="contained"
                color="primary"
                className={classes.actionPrimary}
                onClick={handleSave}
                disabled={!validForm}
                onSpinStop={onSave}
                hasSpinChecker
              >
                <FormattedMessage id="issueProceed" />
              </SpinBlockingButton>
            }
          />
        )}
        {!hasVotes && (
          <SpinBlockingButton
            marketId={marketId}
            variant="contained"
            color="primary"
            className={classes.actionPrimary}
            onClick={handleSave}
            disabled={!validForm}
            onSpinStop={onSave}
            hasSpinChecker
          >
            <FormattedMessage
              id={"agilePlanFormSaveLabel"}
            />
          </SpinBlockingButton>
        )}
      </CardActions>
    </Card>
  );
}

PlanningInvestibleEdit.propTypes = {
  fullInvestible: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  onCancel: PropTypes.func,
  onSave: PropTypes.func,
};

PlanningInvestibleEdit.defaultProps = {
  onSave: () => {
  },
  onCancel: () => {
  },
};
export default PlanningInvestibleEdit;
