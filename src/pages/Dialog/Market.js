import React, { useContext } from 'react';
import { useHistory } from 'react-router';
import _ from 'lodash';
import PropTypes from 'prop-types';
import { withStyles } from '@material-ui/core/styles';
import { injectIntl } from 'react-intl';
import { makeBreadCrumbs, getMarketId } from '../../utils/marketIdPathFunctions';
import Screen from '../../containers/Activity/Screen';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getAllMarketDetails } from '../../contexts/MarketsContext/marketsContextHelper';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper';
import DecisionDialog from './Decision/DecisionDialog';
import PlanningDialog from './Planning/PlanningDialog';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext';
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper';

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

function Market(props) {
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const marketId = getMarketId(pathname);
  const [marketsState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  console.log(investiblesState);
  const [commentsState] = useContext(CommentsContext);
  const marketDetails = getAllMarketDetails(marketsState);
  const { hidden } = props;
  const investibles = getMarketInvestibles(investiblesState, marketId);
  const breadCrumbs = makeBreadCrumbs(history);
  const comments = getMarketComments(commentsState, marketId);
  const commentsHash = _.keyBy(comments, 'id');
  const renderableMarket = marketDetails.find((market) => market.id === marketId) || {};
  const { market_type: marketType } = renderableMarket;
  const currentMarketName = (renderableMarket && renderableMarket.name) || '';
  return (
    <Screen
      title={currentMarketName}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
    >
      { marketType === 'DECISION' && <DecisionDialog market={renderableMarket} investibles={investibles} comments={comments} commentsHash={commentsHash} />}
      { marketType === 'PLANNING' && <PlanningDialog market={renderableMarket} investibles={investibles} />}
    </Screen>
  );
}

Market.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default injectIntl(withStyles(styles)(React.memo(Market)));
