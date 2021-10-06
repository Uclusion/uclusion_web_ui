import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { ACTIVE_STAGE } from '../../constants/markets'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { Card, CardContent, Typography } from '@material-ui/core'
import DeadlineExtender from './Decision/DeadlineExtender'
import CardType from '../../components/CardType'
import { usePlanFormStyles } from '../../components/AgilePlan'
import ManageUsers from './UserManagement/ManageUsers'

function DialogManage(props) {
  const { marketId, expires, onClose } = props;
  const intl = useIntl();
  const classes = usePlanFormStyles();
  const [marketsState] = useContext(MarketsContext);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const { market_stage: marketStage } = renderableMarket;
  const active = marketStage === ACTIVE_STAGE;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId);
  const myPresence = marketPresences && marketPresences.find((presence) => presence.current_user);
  const myRealPresence = myPresence || {};
  const { is_admin: isAdmin} = myRealPresence;

  if (!isAdmin || !active) {
    return React.Fragment;
  }

  if (expires) {
    return (
      <Card>
        <CardType className={classes.cardType}/>
        <CardContent className={classes.cardContent}>
          <Typography>
            {intl.formatMessage({ id: 'decisionDialogExtendDaysLabel' })}
          </Typography>
          <DeadlineExtender
            market={renderableMarket}
            onCancel={onClose}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <Typography className={classes.cardTitle}>
        {intl.formatMessage({ id: 'initiativeAddress' })}
      </Typography>
      <ManageUsers
        market={renderableMarket}
        onCancel={onClose}
      />
    </Card>
  );
}

DialogManage.propTypes = {
  expires: PropTypes.bool,
  marketId: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired
};

DialogManage.defaultProps = {
  expires: false
};

export default DialogManage;
