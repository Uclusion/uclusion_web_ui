import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import { Link, Card } from '@material-ui/core';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { DECISION_TYPE, INITIATIVE_TYPE } from '../../constants/markets';
import { useHistory } from 'react-router';
import Typography from '@material-ui/core/Typography';
import { useIntl } from 'react-intl';
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { getMarketComments } from '../../contexts/CommentsContext/commentsContextHelper'
import { getInvestibleName } from '../../contexts/InvestibesContext/investiblesContextHelper'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import _ from 'lodash';



function MarketSearchResult (props) {
  const { marketId, classes, afterOnClick, link, initiativeName } = props;
  const [marketsState] = useContext(MarketsContext);
  const [commentsState] = useContext(CommentsContext);
  const [investibleState] = useContext(InvestiblesContext);

  const history = useHistory();
  const intl = useIntl();

  const market = getMarket(marketsState, marketId);
  // give up if market is not found
  if (_.isEmpty(market)) {
    return <React.Fragment key={marketId}/>;
  }

  const {
    market_type: type,
    name,
    parent_comment_market_id: parentMarketId,
    parent_comment_id: parentCommentId
  } = market;
  function getTypeId(type) {
    switch (type) {
      case DECISION_TYPE:
        return 'MarketSearchResultDialog';
      case INITIATIVE_TYPE:
        return 'MarketSearchResultInitiative';
      default:
        return 'MarketSearchResultWorkspace';
    }
  }
  function getMarketName (marketId) {
    const market = getMarket(marketsState, marketId);
    if (_.isEmpty(market)) {
      return '';
    }
    const { name } = market;
    return name;
  }
  const inlineComments = getMarketComments(commentsState, parentMarketId) || [];
  const parentComment = inlineComments.find((comment) => comment.id === parentCommentId) || {};
  const parentName = parentComment.investible_id ? getInvestibleName(parentComment.investible_id, investibleState) :
    parentComment.market_id ? getMarketName(parentComment.market_id) : name;
  const usedMarketName = type === INITIATIVE_TYPE && !parentMarketId ? initiativeName : parentName;
  const linkTarget = link ? link : formMarketLink(marketId);
  const typeName = intl.formatMessage({id: getTypeId(type)});

  return (
    <Link
      href={linkTarget}
      className={classes.link}
      onClick={
        (event) => {
          event.stopPropagation();
          event.preventDefault();
          navigate(history, linkTarget);
          afterOnClick();
        }
      }
    >
      <Card className={classes.marketCard}>
        <Typography className={classes.searchResultHeader}>{typeName}</Typography>
        <Typography className={classes.marketSearchName}>{usedMarketName}</Typography>
      </Card>
    </Link>
  );

}

MarketSearchResult.propTypes = {
  marketId: PropTypes.string.isRequired,
  link: PropTypes.string,
  afterOnClick: PropTypes.func,
  initiativeName: PropTypes.string,
};

MarketSearchResult.defaultProps = {
  afterOnClick: () => {},
  link: undefined,
  initiativeName: '',
};

export default MarketSearchResult;