import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { useIntl } from 'react-intl'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { ACTIVE_STAGE } from '../../constants/markets'
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { Card, Link, Typography } from '@material-ui/core'
import { usePlanFormStyles } from '../../components/AgilePlan'
import ManageUsers from './UserManagement/ManageUsers'
import DismissableText from '../../components/Notifications/DismissableText'

function DialogManage(props) {
  const { marketId, isInbox } = props;
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

  if (isInbox) {
    return (
      <ManageUsers
        market={renderableMarket}
      />
    );
  }

  return (
    <Card style={{marginBottom: '1rem'}}>
      <DismissableText textId="planningEditHelp" text={
        <div>
          This is a <Link href="https://documentation.uclusion.com/channels" target="_blank">channel</Link> for
          truly asynchronous communication with context.
        </div>
      }/>
      <Typography className={classes.cardTitle}>
        {intl.formatMessage({ id: 'initiativeAddress' })}
      </Typography>
      <ManageUsers
        market={renderableMarket}
      />
    </Card>
  );
}

DialogManage.propTypes = {
  marketId: PropTypes.string.isRequired
};

export default DialogManage;
