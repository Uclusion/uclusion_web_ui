import React, { useContext, useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { findMessagesForInvestibleId } from '../../../utils/messageUtils';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import { moveInvestibleToCurrentVoting } from '../../../api/investibles';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { DiffContext } from '../../../contexts/DiffContext/DiffContext';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';
import {
  getInCurrentVotingStage,
  getProposedOptionsStage
} from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import { myArchiveClasses } from '../../DialogArchives/ArchiveInvestibles';
import DecisionInvestible from '../../Investible/Decision/DecisionInvestible';
import { getMarket, getMyUserForMarket } from '../../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext';
import { useLocation } from 'react-router';
import OptionListItem from '../../../components/Comments/OptionListItem';
import { nameFromDescription } from '../../../utils/stringFunctions';
import { isRead } from '../../../components/Comments/Options';

function OptionVoting(props) {
  const outlineStyles = myArchiveClasses();
  const location = useLocation();
  const { hash } = location;
  const [selectedInvestibleIdLocal, setSelectedInvestibleIdLocal] = useState(undefined);
  const [marketsState] = useContext(MarketsContext);
  const { marketPresences, investibles, marketId, comments, isAdmin, inArchives, isSent, removeActions,
    selectedInvestibleIdParent, setSelectedInvestibleIdParent } = props;
  const strippedInvestibles = investibles.map(inv => inv.investible);
  const [messagesState] = useContext(NotificationsContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, invDispatch] = useContext(InvestiblesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const inCurrentVotingStage = getInCurrentVotingStage(marketStagesState, marketId);
  const proposedStage = getProposedOptionsStage(marketStagesState, marketId);
  const selectedInvestibleId = selectedInvestibleIdParent || selectedInvestibleIdLocal;
  const setSelectedInvestibleId = setSelectedInvestibleIdParent || setSelectedInvestibleIdLocal;

  useEffect(() => {
    if (hash && !hash.includes(selectedInvestibleId)) {
      const foundInv = (strippedInvestibles || []).find((investible) => hash.includes(investible.id));
      if (foundInv) {
        setSelectedInvestibleId(foundInv.id);
      }
    }
  }, [strippedInvestibles, hash, setSelectedInvestibleId, selectedInvestibleId]);

  function onDragStart(event) {
    event.dataTransfer.setData('text', event.target.id);
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
  function getOptionListItem(inv) {
    let expansionPanel = undefined;
    const expansionOpen = inv.investible.id === selectedInvestibleId;
    if (expansionOpen) {
      expansionPanel = <DecisionInvestible
        userId={getMyUserForMarket(marketsState, marketId) || ''}
        investibleId={selectedInvestibleId}
        market={market}
        fullInvestible={inv}
        comments={comments}
        marketPresences={marketPresences}
        investibleComments={comments.filter((comment) => comment.investible_id === selectedInvestibleId)}
        isAdmin={isAdmin}
        inArchives={inArchives}
        isSent={isSent}
        removeActions={removeActions}
      />
    }
    const investibleId = inv.investible.id;
    const description = nameFromDescription(inv.investible.description);
    const investors = marketPresences.filter((presence) =>
      presence.investments?.find((investment) => !investment.deleted && investment.investible_id === investibleId));
    return (
      <OptionListItem id={investibleId} expansionPanel={expansionPanel} read={isRead(inv, messagesState)}
                      people={investors} description={description} title={inv.investible.name}
                      expandOrContract={() => {
                        if (expansionOpen) {
                          setSelectedInvestibleId(undefined);
                        } else {
                          setSelectedInvestibleId(investibleId);
                        }
                      }} expansionOpen={expansionOpen} />
    )
  }

  const orderedInvestiblesArray = _.orderBy(investibles, [(inv) => {
    return isRead(inv) ? 1 : 0;
  }, (inv) => inv.investible.name]);
  return (
    <div id={`current${marketId}`}
          onDragEnd={removeElementGreen} onDragEnter={setElementGreen}
          onDragOver={(event) => event.preventDefault()} onDrop={onDropApprovable}>
      {(orderedInvestiblesArray || []).map((fullInvestible) => getOptionListItem(fullInvestible))}
    </div>
  );
}

OptionVoting.propTypes = {
  isAdmin: PropTypes.bool,
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketPresences: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
  comments: PropTypes.arrayOf(PropTypes.object),
  inArchives: PropTypes.bool.isRequired,
};

OptionVoting.defaultProps = {
  isAdmin: false,
  investibles: [],
  marketPresences: [],
  comments: []
};

export default OptionVoting;
