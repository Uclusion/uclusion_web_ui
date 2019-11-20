import React, { useContext, useState } from 'react';
import { Grid, Typography, Card, CardContent, CardActions, Link } from '@material-ui/core';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { makeStyles } from '@material-ui/styles';
import PropTypes from 'prop-types';
import { FormattedDate, useIntl } from 'react-intl';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import UpdateIcon from '@material-ui/icons/Update';
import CancelIcon from '@material-ui/icons/Cancel';
import ExitToAppIcon from '@material-ui/icons/ExitToApp';
import VisibilityIcon from '@material-ui/icons/Visibility';
import LinkIcon from '@material-ui/icons/Link';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import ChangeToParticipantButton from './Decision/ChangeToParticipantButton';
import ChangeToObserverButton from './Decision/ChangeToObserverButton';
import DeadlineExtender from './Decision/DeadlineExtender';
import InviteLinker from './Decision/InviteLinker';

const useStyles = makeStyles((theme) => ({
  paper: {
    padding: theme.spacing(2),
    textAlign: 'left',
  },
  textData: {
    fontSize: 12,
  },

}));

function DecisionDialogs(props) {
  const history = useHistory();
  const classes = useStyles();
  const { markets } = props;
  const sortedMarkets = _.sortBy(markets, 'name');
  const intl = useIntl();
  const [marketPresencesState] = useContext(MarketPresencesContext);

  const [showExtension, setShowExtension] = useState({});
  const [showInvite, setShowInvite] = useState({});

  function getParticipantInfo(presences) {
    return presences.map((presence) => {
      const { id: userId, name, following } = presence;
      const icon = following ? <ThumbsUpDownIcon size='small' /> : <VisibilityIcon size='small' />;
      return (
        <Card
          key={userId}
        >
          <Grid
            container
          >
            <Grid
              item
              xs={4}
            >
              <Typography>{name}</Typography>
            </Grid>
            <Grid
              item
              xs={4}
            >
            </Grid>
            <Grid
              item
              xs={4}
            >
              {icon}
            </Grid>
          </Grid>
        </Card>
      );
    });
  }

  function setInviteVisible(value, marketId) {
    setShowInvite({ ...showInvite, [marketId]: value });
  }

  function toggleInviteVisible(marketId) {
    const oldValue = showInvite[marketId];
    const newValue = !oldValue;
    setInviteVisible(newValue, marketId);
  }

  function setMarketExtensionVisible(value, marketId) {
    setShowExtension({ ...showExtension, [marketId]: value });
  }

  function toggleMarketExtensionVisible(marketId) {
    const oldValue = showExtension[marketId];
    const newValue = !oldValue;
    setMarketExtensionVisible(newValue, marketId);
  }

  function getDialogActions(marketId, myPresence) {
    const { is_admin, following } = myPresence;
    const actions = [];
    actions.push(
      <TooltipIconButton
        key="invite"
        translationId="decisionDialogsInviteParticipant"
        icon={<LinkIcon />}
        onClick={() => toggleInviteVisible(marketId)}
      />);
    if (is_admin) {
      actions.push(
        <TooltipIconButton
          key="deadline"
          translationId="decisionDialogsExtendDeadline"
          onClick={() => toggleMarketExtensionVisible(marketId)}
          icon={<UpdateIcon />}
        />
      );
      actions.push(
        <TooltipIconButton
          key="cancel"
          translationId="decisionDialogsCancelDialog"
          icon={<CancelIcon />}
        />
      );
    } else {
      // admins can't exit a dialog or change their role
      actions.push(
        <TooltipIconButton
          key="exit"
          translationId="decisionDialogsExitDialog"
          icon={<ExitToAppIcon />} />
      );
      // if participant you can become observer, or if observer you can become participant
      if (following) {
        actions.push(
          <ChangeToObserverButton key="observe" marketId={marketId} />
        );
      } else {
        actions.push(
          <ChangeToParticipantButton key="participate" marketId={marketId} />
        );
      }
    }
    return actions;
  }

  function getMarketItems() {
    return sortedMarkets.map((market) => {
      const { id: marketId, name, expires_at } = market;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const admin = marketPresences.find((presence) => presence.is_admin) || {};
      const sortedPresences = _.sortBy(marketPresences, 'name');
      return (
        <Grid
          item
          key={marketId}
          xs={12}

        >
          <Card
            className={classes.paper}
          >
            <CardContent>
              <Typography>
                <Link
                  variant="inherit"
                  underline="always"
                  color="primary"
                  onClick={() => navigate(history, formMarketLink(marketId))}
                >
                  {name}
                </Link>
              </Typography>
              <Typography
                color="textSecondary"
                className={classes.textData}
              >
                {intl.formatMessage({ id: 'decisionDialogsStartedBy' }, { name: admin.name })}
              </Typography>

              <Typography
                color="textSecondary"
                className={classes.textData}
              >
                {intl.formatMessage({ id: 'decisionDialogsExpires' })}
                <FormattedDate
                  value={expires_at}
                />
              </Typography>

              {getParticipantInfo(sortedPresences)}
            </CardContent>
            <CardActions>
              {getDialogActions(marketId, myPresence)}
            </CardActions>
            <DeadlineExtender
              hidden={!showExtension[marketId]}
              market={market}
              onCancel={() => setMarketExtensionVisible(false, marketId)}
              onSave={() => setMarketExtensionVisible(false, marketId)}
            />
            <InviteLinker
              hidden={!showInvite[marketId]}
              marketId={marketId}
            />
          </Card>
        </Grid>
      );
    });
  }

  return (
    <Grid container spacing={4}>
      {getMarketItems()}
    </Grid>
  );
}

DecisionDialogs.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default DecisionDialogs;
