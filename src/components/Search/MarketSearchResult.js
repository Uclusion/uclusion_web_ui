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



function MarketSearchResult (props) {
  const { marketId, classes, afterOnClick, link, initiativeName } = props;
  const [marketsState] = useContext(MarketsContext);
  const history = useHistory();
  const market = getMarket(marketsState, marketId);
  const intl = useIntl();
  const {
    market_type: type,
    name,
  } = market;
  const linkTarget = link ? link : formMarketLink(marketId);

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

  const usedMarketName = type === INITIATIVE_TYPE? initiativeName : name;

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