import React, { useContext, useState } from 'react'
import { Button, Card, CardActions, CardContent, } from '@material-ui/core'
import _ from 'lodash'
import PropTypes from 'prop-types'
import { updateInvestible } from '../../../api/investibles'
import { getMarketInfo } from '../../../utils/userFunctions'
import AssignmentList from '../../Dialog/Planning/AssignmentList'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import CardType, { ASSIGN_TYPE, STORY_TYPE } from '../../../components/CardType'
import { FormattedMessage, useIntl } from 'react-intl'
import { DaysEstimate, usePlanFormStyles } from '../../../components/AgilePlan'
import BlockIcon from '@material-ui/icons/Block'
import WarningDialog from '../../../components/Warnings/WarningDialog'
import { useLockedDialogStyles } from '../../Dialog/DialogEdit'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import { makeStyles } from '@material-ui/core/styles'

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
    fullInvestible, onCancel, onSave, marketId, isAssign,
  } = props;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const myClasses = usePlanInvestibleStyles();
  const lockedDialogClasses = useLockedDialogStyles();
  const myInvestible = fullInvestible.investible;
  const marketInfo = getMarketInfo(fullInvestible, marketId) || {};
  const { assigned: marketAssigned, days_estimate: marketDaysEstimate, created_at: createdAt } = marketInfo;
  const [assignments, setAssignments] = useState(marketAssigned);
  const [daysEstimate, setDaysEstimate] = useState(marketDaysEstimate);
  const [open, setOpen] = useState(false);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
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
  const validForm = (!isAssign || (Array.isArray(assignments) && assignments.length > 0));

  const handleOpen = () => {
    setOpen(true);
  };
  const handleClose = () => {
    setOpen(false);
  };

  function onDaysEstimateChange(event) {
    const { value } = event.target;
    const valueInt = value ? parseInt(value, 10) : null;
    setDaysEstimate(valueInt);
  }

  function handleSave() {
    const updateInfo = {
      marketId,
      investibleId: myInvestible.id,
    };
    const assignmentChanged = !_.isEmpty(_.xor(assignments, marketAssigned));
    if (assignmentChanged) {
      updateInfo.assignments = assignments;
    } else if (!_.isEqual(daysEstimate, marketDaysEstimate)) {
      updateInfo.daysEstimate = daysEstimate;
    }
    return updateInvestible(updateInfo)
      .then((fullInvestible) => {
        return {
          result: { fullInvestible, assignmentChanged },
          spinChecker: () => Promise.resolve(true),
        };
      });
  }

  function handleAssignmentChange(newAssignments) {
    setAssignments(newAssignments);
  }
  const subtype = isAssign ? ASSIGN_TYPE : STORY_TYPE;
  const operationLabel = isAssign ? "investibleAssign" : "investibleDescription";
  return (
    <Card elevation={0}>
      <CardType
        className={classes.cardType}
        label={intl.formatMessage({ id: operationLabel })}
        type={STORY_TYPE}
        subtype={subtype}
      />
      <CardContent>
        {isAssign && (
          <div className={classes.cardContent}>
            <AssignmentList
              marketId={marketId}
              previouslyAssigned={marketAssigned}
              onChange={handleAssignmentChange}
            />
          </div>
        )}
        {!isAssign && (
          <div className={classes.cardContent}>
            <fieldset className={myClasses.fieldset}>
              <DaysEstimate onChange={onDaysEstimateChange} value={daysEstimate} createdAt={createdAt} />
            </fieldset>
          </div>
        )}
      </CardContent>
      <CardActions className={classes.actions}>
        {isAssign && (
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
        )}
        {!isAssign && (
          <SpinBlockingButton
            marketId={marketId}
            onClick={onCancel}
            className={classes.actionSecondary}
            color="secondary"
            variant="contained"
            hasSpinChecker
          >
            <FormattedMessage
              id={"marketAddCancelLabel"}
            />
          </SpinBlockingButton>
        )}
        {isAssign && hasVotes && (
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
        {isAssign && hasVotes && (
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
        {(!isAssign || !hasVotes) && (
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
  isAssign: PropTypes.bool.isRequired,
};

PlanningInvestibleEdit.defaultProps = {
  onSave: () => {
  },
  onCancel: () => {
  },
};
export default PlanningInvestibleEdit;
