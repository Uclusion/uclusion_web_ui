import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Screen from '../../containers/Activity/Screen';
import { getMarketId, getInvestibleId, makeBreadCrumbs, formMarketLink } from '../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext';
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import { getMarketDetails } from '../../api/markets';
import QuillEditor from '../../components/TextEditors/QuillEditor';

function Investible(props) {
  const { hidden } = props;
  const history = useHistory();
  const { location } = history;
  const { pathname } = location;
  const marketId = getMarketId(pathname);
  const [marketsState] = useContext(MarketsContext);
  const market = getMarketDetails(marketsState, marketId);
  const investibleId = getInvestibleId(pathname);
  const [investiblesState] = useContext(InvestiblesContext);
  console.log(investiblesState);
  const inv = getInvestible(investiblesState, investibleId);
  const { investible } = inv
  const { name, description } = investible;
  const breadCrumbTemplates = [{ name: market.name, link: formMarketLink(marketId) }];
  const breadCrumbs = makeBreadCrumbs(history, breadCrumbTemplates, true);
  return (
    <Screen
      title={name}
      breadCrumbs={breadCrumbs}
      hidden={hidden}
    >
      <QuillEditor
        readOnly
        defaultValue={description}
      />
    </Screen>
  );
}

Investible.propTypes = {
  hidden: PropTypes.bool,
};

Investible.defaultProps = {
  hidden: false,
};

export default Investible;