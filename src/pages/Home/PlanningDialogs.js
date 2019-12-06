import React, { useContext, useState } from 'react';
import {
  Grid, Typography, Card, CardContent, CardActions, Link,
} from '@material-ui/core';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';
import { makeStyles } from '@material-ui/styles';
import PropTypes from 'prop-types';
import VisibilityIcon from '@material-ui/icons/Visibility';
import LinkIcon from '@material-ui/icons/Link';
import ThumbsUpDownIcon from '@material-ui/icons/ThumbsUpDown';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import ChangeToParticipantButton from './Decision/ChangeToParticipantButton';
import ChangeToObserverButton from './Decision/ChangeToObserverButton';
import InviteLinker from './Decision/InviteLinker';
import LeaveMarketButton from './Decision/LeaveMarketButton';
import ArchiveMarketButton from './Decision/ArchiveMarketButton';
import RaisedCard from '../../components/Cards/RaisedCard';
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions';

const useStyles = makeStyles(() => ({
  paper: {
    textAlign: 'left',
  },
  textData: {
    fontSize: 12,
  },

}));

function PlanningDialogs(props) {
  const history = useHistory();
  const classes = useStyles();
  const { markets } = props;
  const sortedMarkets = _.sortBy(markets, 'name');
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [showInvite, setShowInvite] = useState({});

  function getParticipantInfo(presences) {
    return presences.map((presence) => {
      const { id: userId, name, following } = presence;
      const icon = following ? <ThumbsUpDownIcon size="small" /> : <VisibilityIcon size="small" />;
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

  function getDialogActions(marketId, myPresence) {
    const { following } = myPresence;
    const actions = [];
    actions.push(
      <TooltipIconButton
        key="invite"
        translationId="decisionDialogsInviteParticipant"
        icon={<LinkIcon />}
        onClick={() => toggleInviteVisible(marketId)}
      />,
    );
    actions.push(
      <ArchiveMarketButton key="archive" marketId={marketId} />
    );
    actions.push(
      <LeaveMarketButton key="leave" marketId={marketId} />,
    );
    // if participant you can become observer, or if observer you can become participant
    if (following) {
      actions.push(
        <ChangeToObserverButton key="observe" marketId={marketId} />,
      );
    } else {
      actions.push(
        <ChangeToParticipantButton key="participate" marketId={marketId} />,
      );
    }
    return actions;
  }

  function getMarketItems() {
    return sortedMarkets.map((market) => {
      const { id: marketId, name, market_type } = market;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const sortedPresences = _.sortBy(marketPresences, 'name');
      return (
        <Grid
          item
          key={marketId}
          xs={12}

        >
          <RaisedCard
            className={classes.paper}
            border={1}
          >
            <CardContent>
              {getDialogTypeIcon(market_type)}
              <Typography>
                <Link
                  href="#"
                  variant="inherit"
                  underline="always"
                  color="primary"
                  onClick={() => navigate(history, formMarketLink(marketId))}
                >
                  {name}
                </Link>
              </Typography>
              {getParticipantInfo(sortedPresences)}
            </CardContent>
            <CardActions>
              {getDialogActions(marketId, myPresence)}
            </CardActions>
            <InviteLinker
              hidden={!showInvite[marketId]}
              marketId={marketId}
            />
          </RaisedCard>
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

PlanningDialogs.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default PlanningDialogs;
