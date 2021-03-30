import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Card, CardActions, CardContent, Checkbox, makeStyles, Typography, } from '@material-ui/core'
import { FormattedMessage, useIntl } from 'react-intl'
import { updateMarket } from '../../../api/markets'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import CardType, { DECISION_TYPE } from '../../../components/CardType'
import { usePlanFormStyles } from '../../../components/AgilePlan'
import ExistingUsers from '../UserManagement/ExistingUsers'
import clsx from 'clsx'
import Grid from '@material-ui/core/Grid'

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
    onSpinStop,
    onCancel,
    market,
  } = props;
  const { id, allow_multi_vote: allowMultiVote } = market;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const [multiVote, setMultiVote] = useState(allowMultiVote);
  const myClasses = useStyles();

  function toggleMultiVote() {
    setMultiVote(!multiVote);
  }

  function handleSave() {
    if (allowMultiVote !== multiVote) {
      return updateMarket(id, null, null, null, null,
        null, null, null, multiVote)
        .then((market) => {
          return {
            result: market,
            spinChecker: () => Promise.resolve(true),
          };
        });
    }
    return {
      result: market,
      spinChecker: () => Promise.resolve(true),
    };
  }

  return (
    <Card elevation={0}>
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
        <Button
          onClick={onCancel}
          className={classes.actionSecondary}
          color="secondary"
          variant="contained">
          <FormattedMessage
            id="marketAddCancelLabel"
          />
        </Button>
        <SpinBlockingButton
          marketId={id}
          id="save"
          variant="contained"
          color="primary"
          onClick={handleSave}
          onSpinStop={onSpinStop}
          className={classes.actionPrimary}
          hasSpinChecker
        >
          <FormattedMessage
            id="agilePlanFormSaveLabel"
          />
        </SpinBlockingButton>
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
