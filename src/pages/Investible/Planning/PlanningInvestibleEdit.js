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
import { usePlanFormStyles } from '../../../components/AgilePlan'
import BlockIcon from '@material-ui/icons/Block'
import WarningDialog from '../../../components/Warnings/WarningDialog'
import { useLockedDialogStyles } from '../../Dialog/DialogBodyEdit'
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
    fullInvestible, onCancel, onSave, marketId,
  } = props;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const lockedDialogClasses = useLockedDialogStyles();
  const myInvestible = fullInvestible.investible;
  const marketInfo = getMarketInfo(fullInvestible, marketId) || {};
  const { assigned: marketAssigned } = marketInfo;
  const [assignments, setAssignments] = useState(marketAssigned);
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
      investibleId: myInvestible.id,
      assignments
    };
    const assignmentChanged = !_.isEmpty(_.xor(assignments, marketAssigned));
    if (assignmentChanged) {
      return updateInvestible(updateInfo)
        .then((fullInvestible) => {
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
  const subtype = ASSIGN_TYPE;
  const operationLabel = "investibleAssign";
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
            previouslyAssigned={marketAssigned}
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
