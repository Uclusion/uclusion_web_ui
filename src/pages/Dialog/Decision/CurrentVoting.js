import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { CardContent, Grid, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { red } from '@material-ui/core/colors'
import RaisedCard from '../../../components/Cards/RaisedCard'
import { getVoteTotalsForUser } from '../../../utils/userFunctions'
import VoteCard from '../../../components/Cards/VoteCard'
import { findMessagesForInvestibleId } from '../../../utils/messageUtils'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { moveInvestibleToCurrentVoting } from '../../../api/investibles'
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import {
  getInCurrentVotingStage,
  getProposedOptionsStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { myArchiveClasses } from '../../DialogArchives/ArchiveInvestibles'
import DecisionInvestible from '../../Investible/Decision/DecisionInvestible'
import { getMarket, getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { Clear } from '@material-ui/icons'
import CardHeader from '@material-ui/core/CardHeader'

const useStyles = makeStyles(theme => ({
  noPadding: {
    padding: theme.spacing(0),
    "&:last-child": {
      padding: 0
    }
  },
  warnNoOptions: {
    backgroundColor: red["400"],
    display: 'grid',
    gridTemplateColumns: 'calc(100% - 130px) 130px',
    width: '100%',
    height: '97px',
    padding: '10px 0',
    background: 'white',
  },
  title: {
    display: 'flex',
    alignItems: 'center',
    width: '100%',
    height: '77px',
    margin: '3px',
    padding: '0 20px',
    fontWeight: 'bold',
    color: '#3e3e3e',
    overflow: 'hidden',
  },
  card: {
    marginLeft: '0.5rem',
    marginTop: '0.5rem',
    marginRight: '0.5rem',
    paddingBottom: '1rem'
  }
}));

function CurrentVoting(props) {
  const classes = useStyles();
  const outlineStyles = myArchiveClasses();
  const [selectedInvestibleId, setSelectedInvestibleId] = useState(undefined);
  const [marketsState] = useContext(MarketsContext);
  const { marketPresences, investibles, marketId, comments, isAdmin, inArchives } = props;
  const strippedInvestibles = investibles.map(inv => inv.investible);
  const [messagesState] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const inCurrentVotingStage = getInCurrentVotingStage(marketStagesState, marketId);
  const proposedStage = getProposedOptionsStage(marketStagesState, marketId);

  function getInvestibleVotes() {
    // first set every investibles support and investments to 0
    const tallies = strippedInvestibles.reduce((acc, inv) => {
      const { id } = inv;
      acc[id] = {
        ...inv,
        investments: [],
        numSupporters: 0
      };
      return acc;
    }, {});
    // now we fill in votes from market presences
    marketPresences.forEach(presence => {
      const userInvestments = getVoteTotalsForUser(presence);
      Object.keys(userInvestments).forEach((investible_id) => {
        const oldValue = tallies[investible_id];
        if (oldValue) {
          const newInvestments = [
            ...oldValue.investments,
            userInvestments[investible_id],
          ];
          tallies[investible_id] = {
            ...oldValue,
            investments: newInvestments,
            numSupporters: newInvestments.length,
          };
        }
      });
    });
    return tallies;
  }

  function onDragStart(event) {
    event.dataTransfer.setData('text', event.target.id);
  }

  function getItemVote(item) {
    const { id, investments, name } = item;
    const investibleComments = comments.filter(
      comment => comment.investible_id === id && !comment.parent_id
    );
    const myMessage = !_.isEmpty(findMessagesForInvestibleId(id, messagesState));
    return (
      <Grid item id={id} key={id} xs={12} sm={12} md={6} draggable={!operationRunning && isAdmin}
            onDragStart={onDragStart}>
        <RaisedCard
          className={classes.card}
          elevation={3}
          onClick={() => selectedInvestibleId === id ? setSelectedInvestibleId(undefined) :
            setSelectedInvestibleId(id)}
          isHighlighted={myMessage}
        >
          <CardHeader
            style={{padding: 0, display: selectedInvestibleId === id ? 'flex' : 'none'}}
            action={<IconButton style={{padding: 0}}><Clear /></IconButton>}
          />
          <CardContent className={classes.noPadding}
                       style={{marginTop: selectedInvestibleId === id ? '-1.2rem' : undefined}}>
            <VoteCard
              title={name}
              comments={investibleComments}
              votes={investments}
            />
          </CardContent>
        </RaisedCard>
      </Grid>
    );
  }

  function onDropApprovable(event) {
    const investibleId = event.dataTransfer.getData('text');
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: proposedStage.id,
        stage_id: inCurrentVotingStage.id,
      },
    };
    setOperationRunning(true);
    return moveInvestibleToCurrentVoting(moveInfo)
      .then((inv) => {
        refreshInvestibles(invDispatch, diffDispatch, [inv]);
        setOperationRunning(false);
      });
  }

  const tallies = getInvestibleVotes();
  const talliesArray = Object.values(tallies);
  // descending order of support
  const sortedTalliesArray = _.sortBy(
    talliesArray,
    'numSupporters',
    'name'
  ).reverse();

  function setElementGreen() {
    removeElementGreen();
    document.getElementById(`current${marketId}`).classList.add(outlineStyles.containerGreen);
  }

  function removeElementGreen() {
    [`proposed${marketId}`, `current${marketId}`].forEach((elementId) => {
      document.getElementById(elementId).classList.remove(outlineStyles.containerGreen);
    });
  }
  const market = getMarket(marketsState, marketId);
  return (
    <>
      <Grid container spacing={1} id={`current${marketId}`} className={outlineStyles.white}
            onDragEnd={removeElementGreen} onDragEnter={setElementGreen}
            onDragOver={(event) => event.preventDefault()} onDrop={onDropApprovable}>
        {(sortedTalliesArray || []).map((item) => getItemVote(item))}
      </Grid>
      {selectedInvestibleId && !_.isEmpty(market) && (
        <DecisionInvestible
          userId={getMyUserForMarket(marketsState, marketId) || ''}
          investibleId={selectedInvestibleId}
          market={market}
          fullInvestible={investibles.find((inv) => inv.investible.id === selectedInvestibleId)}
          comments={comments}
          marketPresences={marketPresences}
          investibleComments={comments.filter((comment) => comment.investible_id === selectedInvestibleId)}
          isAdmin={isAdmin}
          inArchives={inArchives}
        />
      )}
    </>
  );
}

CurrentVoting.propTypes = {
  isAdmin: PropTypes.bool,
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
  comments: PropTypes.arrayOf(PropTypes.object),
  inArchives: PropTypes.bool.isRequired,
};

CurrentVoting.defaultProps = {
  isAdmin: false,
  investibles: [],
  marketPresences: [],
  comments: []
};

export default CurrentVoting;
