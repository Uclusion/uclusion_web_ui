import React, { useContext, useEffect, useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import Screen from '../../containers/Screen/Screen'
import { useHistory, useLocation } from 'react-router';
import {
  decomposeMarketPath,
  formMarketLink,
  makeArchiveBreadCrumbs,
  makeBreadCrumbs,
} from '../../utils/marketIdPathFunctions'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext'
import { getNotDoingStage, getVerifiedStage } from '../../contexts/MarketStagesContext/marketStagesContextHelper'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { getInvestiblesInStage, getMarketInvestibles } from '../../contexts/InvestibesContext/investiblesContextHelper'
import SubSection from '../../containers/SubSection/SubSection'
import { useIntl } from 'react-intl'
import ArchiveInvestbiles from './ArchiveInvestibles'
import { SECTION_TYPE_SECONDARY } from '../../constants/global'
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getMarketPresences, getPresenceMap } from '../../contexts/MarketPresencesContext/marketPresencesHelper'
import AssigneeFilterDropdown from './AssigneeFilterDropdown'
import { ACTIVE_STAGE } from '../../constants/markets'
import MarketLinks from '../Dialog/MarketLinks'

function DialogArchives(props) {
  const { hidden } = props;

  const intl = useIntl();
  const history = useHistory();
  const location = useLocation();
  const { pathname } = location;
  const { marketId } = decomposeMarketPath(pathname);
  const [assigneeFilter, setAssigneeFilter] = useState('');
  const [filteredMarketId, setFilteredMarketId] = useState(undefined);
  const [marketsState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId) || []
  const myPresence = marketPresences.find((presence) => presence.current_user);
  const presenceMap = getPresenceMap(marketPresencesState, marketId);
  const renderableMarket = getMarket(marketsState, marketId) || {};
  const verifiedStage = getVerifiedStage(marketStagesState, marketId) || {};
  const notDoingStage = getNotDoingStage(marketStagesState, marketId) || {};

  const marketInvestibles = getMarketInvestibles(investiblesState, marketId) || [];

  const verifiedInvestibles = getInvestiblesInStage(marketInvestibles, verifiedStage.id);
  const notDoingInvestibles = getInvestiblesInStage(marketInvestibles, notDoingStage.id);

  const filteredVerifiedInvestibles = verifiedInvestibles.filter((inv) => {
    if (_.isEmpty(assigneeFilter)) {
      return true;
    }
    const { market_infos } = inv;
    const myInfo = market_infos.find((element) => element.market_id === marketId);
    return myInfo && myInfo.assigned.includes(assigneeFilter);
  });

  const { name, market_stage: marketStage, children } = renderableMarket;
  const inArchives = marketStage !== ACTIVE_STAGE || (myPresence && !myPresence.following);
  const breadCrumbTemplates = [{ name, link: formMarketLink(marketId) }];
  const breadCrumbs = inArchives? makeArchiveBreadCrumbs(history, breadCrumbTemplates)
    : makeBreadCrumbs(history, breadCrumbTemplates);

  function onFilterChange(event) {
    const { value } = event.target;
    setAssigneeFilter(value);
    setFilteredMarketId(marketId);
  }

  useEffect(() => {
    if (filteredMarketId && filteredMarketId !== marketId) {
      setFilteredMarketId(undefined);
      setAssigneeFilter('');
    }
  }, [filteredMarketId, marketId]);

  if (!marketId) {
    return (
      <Screen
        hidden={hidden}
        tabTitle={intl.formatMessage({ id: 'dialogArchivesLabel' })}
      >
        Not Ready
      </Screen>
    );
  }

  return (
    <Screen
      hidden={hidden}
      title={intl.formatMessage({ id: 'dialogArchivesLabel' })}
      tabTitle={intl.formatMessage({ id: 'dialogArchivesLabel' })}
      breadCrumbs={breadCrumbs}
    >
      <SubSection
        type={SECTION_TYPE_SECONDARY}
        title={intl.formatMessage({ id: 'dialogArchivesVerifiedHeader' })}
        actionButton={
          (<AssigneeFilterDropdown
            onChange={onFilterChange}
            presences={marketPresences}
            value={assigneeFilter}
          />)}
      >
        <ArchiveInvestbiles
          marketId={marketId}
          investibles={filteredVerifiedInvestibles}
          presenceMap={presenceMap}
          elevation={0}
        />
      </SubSection>
      <SubSection
        type={SECTION_TYPE_SECONDARY}
        title={intl.formatMessage({ id: 'dialogArchivesNotDoingHeader' })}
        style={{marginTop: '16px'}}
      >
        <ArchiveInvestbiles
          marketId={marketId}
          presenceMap={presenceMap}
          investibles={notDoingInvestibles}
          elevation={0}
        />
      </SubSection>
      <MarketLinks links={children || []} isArchive />
    </Screen>
  );
}

DialogArchives.propTypes = {
  hidden: PropTypes.bool,
};

DialogArchives.defaultProps = {
  hidden: false,
};

export default DialogArchives;