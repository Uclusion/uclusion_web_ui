import React, { useState } from 'react'
import PropTypes from 'prop-types'
import { Button, Card, CardActions, CardContent, Checkbox, Typography, } from '@material-ui/core'
import { FormattedMessage, useIntl } from 'react-intl'
import { updateMarket } from '../../../api/markets'
import SpinBlockingButton from '../../../components/SpinBlocking/SpinBlockingButton'
import CardType, { DECISION_TYPE } from '../../../components/CardType'
import { usePlanFormStyles } from '../../../components/AgilePlan'

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
        <Typography>
          {intl.formatMessage({ id: 'allowMultiVote' })}
          <Checkbox
            id="multiVote"
            name="multiVote"
            checked={multiVote}
            onChange={toggleMultiVote}
          />
        </Typography>
      </CardContent>
      <CardActions className={classes.actions}>
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
