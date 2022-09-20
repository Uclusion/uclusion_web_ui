import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { Card, CardActions, CardContent, Checkbox, makeStyles, Typography, } from '@material-ui/core'
import { useIntl } from 'react-intl'
import { updateMarket } from '../../../api/markets'
import CardType, { DECISION_TYPE } from '../../../components/CardType'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import ExistingUsers from '../UserManagement/ExistingUsers'
import clsx from 'clsx'
import Grid from '@material-ui/core/Grid'
import SpinningIconLabelButton from '../../../components/Buttons/SpinningIconLabelButton'
import { Clear, SettingsBackupRestore } from '@material-ui/icons'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { addMarketToStorage } from '../../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'

const useStyles = makeStyles((theme) => {
  return {
    actions: {
      margin: theme.spacing(-3, 0, 0, 6),
      paddingBottom: '2rem'
    }
  };
});

function DecisionDialogEdit(props) {
  const {
    userId,
    onCancel,
    market,
  } = props;
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const { id, allow_multi_vote: allowMultiVote } = market;
  const intl = useIntl();
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, diffDispatch] = useContext(DiffContext);
  const classes = usePlanFormStyles();
  const [multiVote, setMultiVote] = useState(allowMultiVote);
  const myClasses = useStyles();

  function toggleMultiVote() {
    setMultiVote(!multiVote);
  }

  function handleSave() {
    if (allowMultiVote !== multiVote) {
      return updateMarket(id, null, null, null, null,
        null, null, multiVote)
        .then((market) => {
          const diffSafe = {
            ...market,
            updated_by: userId,
            updated_by_you: true,
          };
          addMarketToStorage(marketsDispatch, diffSafe);
          setOperationRunning(false);
        });
    }
  }

  return (
    <Card>
      <CardType className={classes.cardType} type={DECISION_TYPE} />
      <CardContent className={classes.cardContent}>
        <Grid container className={clsx(classes.fieldset, classes.flex, classes.justifySpace)}>
          <Grid item md={6} xs={12} className={classes.fieldsetContainer}>
            <ExistingUsers market={market} />
          </Grid>
        </Grid>
        <Grid container className={clsx(classes.fieldset, classes.flex, classes.justifySpace)}
              style={{paddingTop: "2rem"}}>
          <Grid item md={12} xs={12} className={classes.fieldsetContainer}>
            <Typography>
              {intl.formatMessage({ id: 'allowMultiVote' })}
              <Checkbox
                id="multiVote"
                name="multiVote"
                checked={multiVote}
                onChange={toggleMultiVote}
              />
            </Typography>
          </Grid>
        </Grid>
      </CardContent>
      <CardActions className={myClasses.actions}>
        <SpinningIconLabelButton onClick={onCancel} doSpin={false} icon={Clear}>
          {intl.formatMessage({ id: 'marketAddCancelLabel' })}
        </SpinningIconLabelButton>
        <SpinningIconLabelButton onClick={handleSave} icon={SettingsBackupRestore} id="agilePlanFormSaveButton">
          {intl.formatMessage({ id: 'agilePlanFormSaveLabel' })}
        </SpinningIconLabelButton>
      </CardActions>
    </Card>
  );
}

DecisionDialogEdit.propTypes = {
  market: PropTypes.object.isRequired,
  onSpinStop: PropTypes.func,
  onCancel: PropTypes.func,
};

DecisionDialogEdit.defaultProps = {
  onCancel: () => {
  },
  onSpinStop: () => {
  },
};

export default DecisionDialogEdit;
