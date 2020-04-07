import React from 'react'
import PropTypes from 'prop-types'
import { Grid, Typography } from '@material-ui/core'
import _ from 'lodash'
import RaisedCard from '../../components/Cards/RaisedCard'
import { useIntl } from 'react-intl'
import { formInvestibleLink, navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'

function getInvestibleOnClick(id, marketId, history) {
  return () => {
    const link = formInvestibleLink(marketId, id);
    navigate(history, link);
  };
}

export function getInvestibles(investibles, presenceMap, marketId, history, intl) {
  const investibleData = investibles.map((inv) => inv.investible);
  const sortedData = _.sortBy(investibleData, 'updated_at', 'name').reverse();
  const infoMap = investibles.reduce((acc, inv) => {
    const { investible, market_infos } = inv;
    const myInfo = market_infos.find((info) => info.market_id === marketId);
    const { id } = investible;
    return {
      ...acc,
      [id]: myInfo,
    };
  }, {});
  return sortedData.map((investible) => {
    const { id, name, updated_at } = investible;
    const info = infoMap[id] || {};
    const { assigned } = info;
    const usedAssignees = assigned || [];
    const assignedNames = usedAssignees.map((element) => {
      const presence = presenceMap[element];
      return presence ? presence.name : '';
    });
    return (
      <Grid
        key={id}
        item
        xs={3}
      >
        <RaisedCard
          onClick={getInvestibleOnClick(id, marketId, history)}
        >
          <Typography>{intl.formatDate(updated_at)}</Typography>
          <Typography>{name}</Typography>
          {assignedNames.map((name) => (<Typography key={name}>{name}</Typography>))}
        </RaisedCard>
      </Grid>
    );
  });
}

function ArchiveInvestbiles(props) {
  const {
    investibles,
    marketId,
    presenceMap,
  } = props;
  const intl = useIntl();
  const history = useHistory();

  return (
    <Grid
      container
      spacing={2}
    >
      {getInvestibles(investibles, presenceMap, marketId, history, intl)}
    </Grid>
  );
}

ArchiveInvestbiles.propTypes = {
  investibles: PropTypes.arrayOf(PropTypes.object),
  marketId: PropTypes.string.isRequired,
  presenceMap: PropTypes.object,
};

ArchiveInvestbiles.defaultProps = {
  investibles: [],
  presenceMap: {},
};

export default ArchiveInvestbiles;
