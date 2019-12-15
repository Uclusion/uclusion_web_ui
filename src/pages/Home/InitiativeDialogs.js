import React, { useContext, useState } from 'react';
import {
  Grid, Typography, CardContent, CardActions, Link,
} from '@material-ui/core';
import _ from 'lodash';
import { useHistory } from 'react-router-dom';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import UpdateIcon from '@material-ui/icons/Update';
import LinkIcon from '@material-ui/icons/Link';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import ChangeToParticipantButton from './Decision/ChangeToParticipantButton';
import ChangeToObserverButton from './Decision/ChangeToObserverButton';
import DeadlineExtender from './Decision/DeadlineExtender';
import InviteLinker from './Decision/InviteLinker';
import LeaveMarketButton from './Decision/LeaveMarketButton';
import ArchiveMarketButton from './Decision/ArchiveMarketButton';
import RaisedCard from '../../components/Cards/RaisedCard';
import ExpiresDisplay from '../../components/Expiration/ExpiresDisplay';
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { getParticipantInfo } from '../../utils/userFunctions';

const useStyles = makeStyles(() => ({
  paper: {
    textAlign: 'left',
  },
  textData: {
    fontSize: 12,
  },

}));

function InitiativeDialogs(props) {
  const history = useHistory();
  const classes = useStyles();
  const { markets } = props;
  const sortedMarkets = _.sortBy(markets, 'name');
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [showExtension, setShowExtension] = useState({});
  const [showInvite, setShowInvite] = useState({});

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

  function getDialogActions(marketId, myPresence, marketStage) {
    const { is_admin, following } = myPresence;
    const actions = [];
    actions.push(
      <TooltipIconButton
        key="invite"
        translationId="decisionDialogsInviteParticipant"
        icon={<LinkIcon />}
        onClick={() => toggleInviteVisible(marketId)}
      />,
    );
    if (is_admin) {
      if (marketStage === 'Active') {
        actions.push(
          <TooltipIconButton
            key="deadline"
            translationId="decisionDialogsExtendDeadline"
            onClick={() => toggleMarketExtensionVisible(marketId)}
            icon={<UpdateIcon/>}
          />,
        );
      }
      else {
        actions.push(
          <ArchiveMarketButton key="archive" marketId={marketId}/>,
        );
      }
    } else {
      // admins can't exit a dialog or change their role
      actions.push(
        <LeaveMarketButton key="leave" marketId={marketId} />,
      );
      if (marketStage === 'Active') {
        // if participant you can become observer, or if observer you can become participant
        if (following) {
          actions.push(
            <ChangeToObserverButton key="observe" marketId={marketId}/>,
          );
        } else {
          actions.push(
            <ChangeToParticipantButton key="participate" marketId={marketId}/>,
          );
        }
      }
    }
    return actions;
  }

  function getMarketItems() {
    return sortedMarkets.map((market) => {
      const {
        id: marketId, created_at: createdAt, expiration_minutes: expirationMinutes,
        market_type: marketType, market_stage: marketStage,
      } = market;
      const investibles = getMarketInvestibles(investiblesState, marketId);
      if (!investibles || _.isEmpty(investibles)) {
        return <React.Fragment />;
      }
      const baseInvestible = investibles[0];
      const { investible } = baseInvestible;
      const { name } = investible;
      const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
      const marketPresencesFollowing = marketPresences.filter((presence) => presence.following);
      const myPresence = marketPresences.find((presence) => presence.current_user) || {};
      const sortedPresences = _.sortBy(marketPresencesFollowing, 'name');
      const marketInvestibles = getMarketInvestibles(investiblesState, marketId);
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
              <Grid
                container
              >
                <Grid
                  item
                  xs={3}
                >
                  {getDialogTypeIcon(marketType)}
                </Grid>
              </Grid>
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
              <Grid
                container
              >
                <Grid
                  item
                  xs={3}
                >
                  <ExpiresDisplay
                    createdAt={createdAt}
                    expirationMinutes={expirationMinutes}
                  />
                </Grid>
                <Grid
                  item
                  xs={9}
                >
                  {getParticipantInfo(sortedPresences, marketInvestibles)}
                </Grid>
              </Grid>
            </CardContent>
            <CardActions>
              {getDialogActions(marketId, myPresence, marketStage)}
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

InitiativeDialogs.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  markets: PropTypes.arrayOf(PropTypes.object).isRequired,
};

export default InitiativeDialogs;
