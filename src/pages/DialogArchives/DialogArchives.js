import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Screen from '../../containers/Screen/Screen';
import { useHistory } from 'react-router';
import { decomposeMarketPath, formMarketLink, makeBreadCrumbs } from '../../utils/marketIdPathFunctions';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { MarketStagesContext } from '../../contexts/MarketStagesContext/MarketStagesContext';
import {
  getNotDoingStage,
  getVerifiedStage
} from '../../contexts/MarketStagesContext/marketStagesContextHelper';
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper';
import {
  getMarketInvestibles,
  getInvestiblesInStage
} from '../../contexts/InvestibesContext/investiblesContextHelper';
import SubSection from '../../containers/SubSection/SubSection';
import { useIntl } from 'react-intl';
import ArchiveInvestbiles from './ArchiveInvestibles';

function DialogArchives(props) {
  const { hidden } = props;

  const intl = useIntl();
  const history = useHistory();
  const { location: { pathname } } = history;
  const { marketId } = decomposeMarketPath(pathname);

  const [marketsState] = useContext(MarketsContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);

  const renderableMarket = getMarket(marketsState, marketId) || {};
  const verifiedStage = getVerifiedStage(marketStagesState, marketId) || {};
  const notDoingStage = getNotDoingStage(marketStagesState, marketId) || {};

  const marketInvestibles = getMarketInvestibles(investiblesState, marketId);

  const verifiedInvestibles = getInvestiblesInStage(marketInvestibles, verifiedStage.id);
  const notDoingInvestibles = getInvestiblesInStage(marketInvestibles, notDoingStage.id);


  const { name } = renderableMarket;
  const breadCrumbTemplates = [{ name, link: formMarketLink(marketId) }];
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);

  return (
    <Screen
      hidden={hidden}
      title={intl.formatMessage({ id: 'dialogArchivesLabel'})}
      breadCrumbs={breadCrumbs}
    >
      <SubSection
        title={intl.formatMessage({ id: 'dialogArchivesVerifiedHeader' })}
      >
        <ArchiveInvestbiles
          marketId={marketId}
          investibles={verifiedInvestibles}
        />
      </SubSection>
      <SubSection
        title={intl.formatMessage({ id: 'dialogArchivesNotDoingHeader' })}
      >
        <ArchiveInvestbiles
          marketId={marketId}
          investibles={notDoingInvestibles}
        />
      </SubSection>
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