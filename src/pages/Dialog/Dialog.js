import React, { useContext, useState } from 'react';
import { useHistory } from 'react-router';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { makeBreadCrumbs, decomposeMarketPath } from '../../utils/marketIdPathFunctions';
import Screen from '../../containers/Screen/Screen';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getAllMarketDetails } from '../../contexts/MarketsContext/marketsContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import DecisionDialog from './Decision/DecisionDialog';
import PlanningDialog from './Planning/PlanningDialog';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import { getStages } from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import DecisionSidebarActions from './Decision/DecisionSidebarActions';

const styles = (theme) => ({
  root: {
    height: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  toolbar: {
    width: '100%',
    display: 'flex',
    alignItems: 'flex-end',
    flexWrap: 'wrap',
  },
  toolbarButton: {
    margin: theme.spacing(1),
  },
  content: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  stageSelector: {
    display: 'flex',
    alignItems: 'center',
    margin: theme.spacing(),
    marginTop: theme.spacing(2),
    width: 384,
    [theme.breakpoints.only('xs')]: {
      width: '100%',
    },
  },
});

function Dialog(props) {
  const [addInvestibleMode, setAddInvestibleMode] = useState(false);
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const [marketsState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [commentsState] = useContext(CommentsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketDetails = getAllMarketDetails(marketsState);
  const { hidden } = props;
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const breadCrumbs = makeBreadCrumbs(history);
  const comments = getMarketComments(commentsState, marketId);
  const commentsHash = _.keyBy(comments, 'id');
  const renderableMarket = marketDetails.find((market) => market.id === marketId) || {};
  const { market_type: marketType } = renderableMarket;
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  const marketStages = getStages(marketStagesState, marketId);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const loading = !myPresence;
  const sideBarActions = addInvestibleMode? undefined: <DecisionSidebarActions onClick={() => setAddInvestibleMode(true)}/>;
  return (
    <Screen
      title={currentMarketName}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
      loading={loading}
      commentsSidebar={!addInvestibleMode}
      sidebarActions={sideBarActions}
    >
      { marketType === 'DECISION' && !loading && (
        <DecisionDialog
          addInvestibleMode={addInvestibleMode}
          setAddInvestibleMode={setAddInvestibleMode}
          market={renderableMarket}
          investibles={investibles}
          comments={comments}
          commentsHash={commentsHash}
          marketStages={marketStages}
          marketPresences={marketPresences}
          myPresence={myPresence}
        />
      )}
      { marketType === 'PLANNING' && <PlanningDialog market={renderableMarket} investibles={investibles} />}
    </Screen>
  );
}

Dialog.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default injectIntl(withStyles(styles)(React.memo(Dialog)));
