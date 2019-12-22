import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { useIntl } from 'react-intl';
import { Grid, Typography } from '@material-ui/core';
import ReadOnlyQuillEditor from '../../components/TextEditors/ReadOnlyQuillEditor';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import { getMarketPresences } from '../../contexts/MarketPresencesContext/marketPresencesHelper';
import { INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';
import AddressList from './AddressList';

function Summary(props) {
  const { market, showObservers } = props;
  const intl = useIntl();
  const { id, description, market_type: marketType } = market;
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, id) || [];
  const marketPresencesObserving = marketPresences.filter((presence) => !presence.following);
  const marketPresencesModerating = marketPresences.filter((presence) => presence.is_admin);

  function displayUserList(presencesList) {
    return presencesList.map((presence) => {
      const { name } = presence;
      return (
        <Grid
          item
        >
          <Typography>{name}</Typography>
        </Grid>
      )
    });
  }
  return (
    <>
      {marketType !== PLANNING_TYPE && Array.isArray(marketPresencesModerating) && (
        <Grid
          container
        >
          <Grid
            item
            xs={2}
          >
            <Typography>
              {intl.formatMessage({ id: 'created_by' })}
            </Typography>
          </Grid>
          <Grid
            item
            xs={10}
          >
            {displayUserList(marketPresencesModerating)}
          </Grid>
        </Grid>
      )}
      {showObservers && Array.isArray(marketPresencesObserving) && (
        <Grid
          container
        >
          <Grid
            item
            xs={2}
          >
            <Typography>
              {intl.formatMessage({ id: 'observers' })}
            </Typography>
          </Grid>
          <Grid
            item
            xs={10}
          >
            {displayUserList(marketPresencesObserving)}
          </Grid>
        </Grid>
      )}
      {marketType !== INITIATIVE_TYPE && (
        <ReadOnlyQuillEditor marketId={id} value={description} />
      )}
    </>
  );
}

Summary.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  market: PropTypes.object.isRequired,
  showObservers: PropTypes.bool,
};

Summary.defaultProps = {
  showObservers: true,
};

export default Summary;
