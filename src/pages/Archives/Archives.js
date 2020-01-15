import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { useHistory } from 'react-router';
import { useIntl } from 'react-intl';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import {
  getHiddenMarketDetailsForUser,
} from '../../contexts/MarketsContext/marketsContextHelper';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';
import Screen from '../../containers/Screen/Screen';
import PlanningDialogs from '../Home/PlanningDialogs';
import DecisionDialogs from '../Home/DecisionDialogs';
import InitiativeDialogs from '../Home/InitiativeDialogs';
import { makeBreadCrumbs } from '../../utils/marketIdPathFunctions';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import ArchivesCheatSheet from './ArchivesCheatSheet';

function Archives(props) {
  const { hidden } = props;
  const history = useHistory();
  const intl = useIntl();

  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const hiddenMarkets = getHiddenMarketDetailsForUser(marketsState, marketPresencesState);
  const planningDetails = hiddenMarkets.filter((market) => market.market_type === PLANNING_TYPE);
  const decisionDetails = hiddenMarkets.filter((market) => market.market_type === DECISION_TYPE);
  const initiativeDetails = hiddenMarkets.filter((market) => market.market_type === INITIATIVE_TYPE);
  const emptyArchives = _.isEmpty(planningDetails) && _.isEmpty(decisionDetails) && _.isEmpty(initiativeDetails);

  const breadCrumbs = makeBreadCrumbs(history, [], true);
  return (
    <Screen
      title={intl.formatMessage({ id: 'archivesTitle' })}
      tabTitle={intl.formatMessage({ id: 'archivesTitle' })}
      hidden={hidden}
      breadCrumbs={breadCrumbs}
    >
      { emptyArchives && (
        <ArchivesCheatSheet />
      )}
      {!emptyArchives && (
        <>
            <PlanningDialogs markets={planningDetails}/>
            <DecisionDialogs markets={decisionDetails}/>
            <InitiativeDialogs markets={initiativeDetails}/>
        </>
      )}
    </Screen>
  );
}

Archives.propTypes = {
  hidden: PropTypes.bool,
};

Archives.defaultProps = {
  hidden: false,
};

export default Archives;
