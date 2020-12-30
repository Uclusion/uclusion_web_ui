import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { Link, Card } from '@material-ui/core'
import { navigate } from '../../utils/marketIdPathFunctions'
import { useIntl } from 'react-intl'
import { useHistory } from 'react-router'
import Typography from '@material-ui/core/Typography';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'


function getTypeNameId() {
  return 'NotificationResultJustify';
}

function VotingVisitedResult(props) {
  const {
    marketId,
    containerName,
    classes,
    afterOnClick,
    link,
    userId
  } = props;
  const intl = useIntl();
  const history = useHistory();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || [];
  const creator = marketPresences.find((presence) => (presence.id === userId));
  function getCardClass() {
      return classes.justifyCard;
  }
  const cardClass = getCardClass();
  const typeName = intl.formatMessage({ id: getTypeNameId()});
  const excerpt = (creator || {}).name;

  return (
    <Link href={link} className={classes.link} onClick={
      (event) => {
        event.stopPropagation();
        event.preventDefault();
        navigate(history, link);
        afterOnClick();
      }
    }>
      <Card className={cardClass}>
        <Typography className={classes.commentSearchTitle}>{typeName}</Typography>
        <Typography className={classes.commentSearchName}>{containerName}</Typography>
        <Typography className={classes.commentSearchExcerpt}>
          {intl.formatMessage({id: 'CommentSearchResultExcerpt'}, {excerpt})}</Typography>
      </Card>
    </Link>
  );

}

VotingVisitedResult.propTypes = {
  marketId: PropTypes.string.isRequired,
  containerName: PropTypes.string.isRequired,
  userId: PropTypes.string.isRequired,
  link: PropTypes.string.isRequired,
  afterOnClick: PropTypes.func,
};

VotingVisitedResult.defaultProps = {
  afterOnClick: () => {},
}

export default VotingVisitedResult;

