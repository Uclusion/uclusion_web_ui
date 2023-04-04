import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import { CardContent, Grid, IconButton } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import RaisedCard from '../../../components/Cards/RaisedCard'
import OptionCard from '../../../components/Cards/OptionCard'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import { moveInvestibleBackToOptionPool } from '../../../api/investibles'
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper'
import {
  getInCurrentVotingStage,
  getProposedOptionsStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper'
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext'
import { DiffContext } from '../../../contexts/DiffContext/DiffContext'
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext'
import { findMessagesForInvestibleId } from '../../../utils/messageUtils'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { myArchiveClasses } from '../../DialogArchives/ArchiveInvestibles'
import { Clear } from '@material-ui/icons'
import DecisionInvestible from '../../Investible/Decision/DecisionInvestible'
import { getMarket, getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import CardHeader from '@material-ui/core/CardHeader'

const useStyles = makeStyles((theme) => ({
  textData: {
    fontSize: 12,
  },
  noPadding: {
    padding: theme.spacing(0),
    "&:last-child": {
      padding: 0
    }
  },
  grow: {
    padding: '30px',
    flexGrow: 1,
  },
  card: {
    marginLeft: '0.5rem',
    marginTop: '0.5rem',
    marginRight: '0.5rem',
    paddingBottom: '1rem'
  }
}));

function ProposedIdeas(props) {
  const classes = useStyles();
  const outlineStyles = myArchiveClasses();
  const { investibles, marketId, isAdmin, comments, inArchives, marketPresences, isSent,
    selectedInvestibleIdParent, setSelectedInvestibleIdParent, removeActions} = props;
  const [selectedInvestibleIdLocal, setSelectedInvestibleIdLocal] = useState(undefined);
  const [marketsState] = useContext(MarketsContext);
  const [messagesState] = useContext(NotificationsContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const inCurrentVotingStage = getInCurrentVotingStage(marketStagesState, marketId);
  const proposedStage = getProposedOptionsStage(marketStagesState, marketId);
  const selectedInvestibleId = selectedInvestibleIdParent || selectedInvestibleIdLocal;
  const setSelectedInvestibleId = setSelectedInvestibleIdParent || setSelectedInvestibleIdLocal;

  function onDragStart(event) {
    event.dataTransfer.setData('text', event.target.id);
  }

  function onDropProposed(event) {
    const investibleId = event.dataTransfer.getData('text');
    const moveInfo = {
      marketId,
      investibleId,
      stageInfo: {
        current_stage_id: inCurrentVotingStage.id,
        stage_id: proposedStage.id,
      },
    };
    setOperationRunning(true);
    return moveInvestibleBackToOptionPool(moveInfo)
      .then((inv) => {
        refreshInvestibles(invDispatch, diffDispatch, [inv]);
        setOperationRunning(false);
      });
  }
  
  function getInvestibles() {
    return investibles.map((inv) => {
      const { investible } = inv;
      const { id, name } = investible;
      const myMessage = !_.isEmpty(findMessagesForInvestibleId(id, messagesState));
      return (
        <Grid
          item
          key={id} id={id}
          xs={12}
          sm={6}
          draggable={!operationRunning && isAdmin} onDragStart={onDragStart}
        >
          <RaisedCard
            className={classes.card}
            onClick={() => selectedInvestibleId === id ? setSelectedInvestibleId(undefined) :
              setSelectedInvestibleId(id)}
            elevation={3}
            isHighlighted={myMessage}
          >
            <CardHeader
              style={{padding: 0, display: selectedInvestibleId === id ? 'flex' : 'none'}}
              action={<IconButton style={{padding: 0}}><Clear /></IconButton>}
            />
            <CardContent className={classes.noPadding}
                         style={{marginTop: selectedInvestibleId === id ? '-1.2rem' : undefined}}>
              <OptionCard
                title={name} />
            </CardContent>
          </RaisedCard>
        </Grid>
      );
    });
  }

  function setElementGreen() {
    removeElementGreen();
    document.getElementById(`proposed${marketId}`).classList.add(outlineStyles.containerGreen);
  }

  function removeElementGreen() {
    [`proposed${marketId}`, `current${marketId}`].forEach((elementId) => {
      document.getElementById(elementId).classList.remove(outlineStyles.containerGreen);
    });
  }
  const market = getMarket(marketsState, marketId);
  const fullInvestible = investibles.find((inv) => inv.investible.id === selectedInvestibleId);
  return (
    <>
      <Grid container className={outlineStyles.white} spacing={1} id={`proposed${marketId}`}
            onDragEnd={removeElementGreen} onDragEnter={setElementGreen}
            onDragOver={(event) => event.preventDefault()}
            onDrop={onDropProposed}>
        {getInvestibles()}
        {_.isEmpty(investibles) && (
          <div className={classes.grow} />
        )}
      </Grid>
      {!_.isEmpty(fullInvestible) && !_.isEmpty(fullInvestible.investible) && !_.isEmpty(market) && (
        <DecisionInvestible
          userId={getMyUserForMarket(marketsState, marketId) || ''}
          investibleId={selectedInvestibleId}
          market={market}
          fullInvestible={fullInvestible}
          comments={comments}
          marketPresences={marketPresences}
          investibleComments={comments.filter((comment) => comment.investible_id === selectedInvestibleId)}
          isAdmin={isAdmin}
          inArchives={inArchives}
          isSent={isSent}
          removeActions={removeActions}
        />
      )}
    </>
  );

}

ProposedIdeas.propTypes = {
  isAdmin: PropTypes.bool,
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  marketId: PropTypes.string.isRequired,
};

ProposedIdeas.defaultProps = {
  isAdmin: false
}

export default ProposedIdeas;