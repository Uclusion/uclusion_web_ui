import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { useHistory } from 'react-router'
import _ from 'lodash'
import { CardContent, Grid } from '@material-ui/core'
import { makeStyles } from '@material-ui/styles'
import { formInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions'
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
  const history = useHistory();
  const classes = useStyles();
  const outlineStyles = myArchiveClasses();
  const { investibles, marketId, isAdmin } = props;
  const [messagesState] = useContext(NotificationsContext);
  const [operationRunning, setOperationRunning] = useContext(OperationInProgressContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const inCurrentVotingStage = getInCurrentVotingStage(marketStagesState, marketId);
  const proposedStage = getProposedOptionsStage(marketStagesState, marketId);

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
            onClick={() => navigate(history, formInvestibleLink(marketId, id))}
            elevation={3}
            isHighlighted={myMessage}
          >
            <CardContent className={classes.noPadding}>
              <OptionCard
                title={name} />
            </CardContent>
          </RaisedCard>
        </Grid>
      );
    });
  }

  function setElementGreen() {
    console.debug('Got here green');
    removeElementGreen();
    document.getElementById(`proposed${marketId}`).classList.add(outlineStyles.containerGreen);
  }

  function removeElementGreen() {
    [`proposed${marketId}`, `current${marketId}`].forEach((elementId) => {
      document.getElementById(elementId).classList.remove(outlineStyles.containerGreen);
    });
  }

  return (
    <Grid container className={outlineStyles.white} spacing={1} id={`proposed${marketId}`} onDragEnd={removeElementGreen} onDragEnter={setElementGreen}
          onDragOver={(event) => event.preventDefault()}
          onDrop={onDropProposed}>
      {getInvestibles()}
      {_.isEmpty(investibles) && (
        <div className={classes.grow} />
      )}
    </Grid>
  );

}

ProposedIdeas.propTypes = {
  isAdmin: PropTypes.bool.isRequired,
  investibles: PropTypes.arrayOf(PropTypes.object).isRequired,
  marketId: PropTypes.string.isRequired,
};

export default ProposedIdeas;