import React from 'react';
import PropTypes from 'prop-types';
import { Paper, Typography } from '@material-ui/core';
import { getMarketInfo } from '../../../../utils/userFunctions';

function DisplayAssignments(props) {
  const { investible, marketId, marketPresences } = props;

  function renderAssignments() {
    const marketInfo = getMarketInfo(investible, marketId);
    const { assigned } = marketInfo;
    return assigned.map((userId) => {
      const user = marketPresences.find((presence) => presence.id === userId);
      return (
        <Paper
          key={userId}
        >
          <Typography>
            {user.name}
          </Typography>
        </Paper>
      );
    });
  }

  return (
    <Paper>
      {renderAssignments()}
    </Paper>
  );
}

DisplayAssignments.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  investible: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  marketPresences: PropTypes.arrayOf(PropTypes.object),
};

DisplayAssignments.defaultProps = {
  marketPresences: [],
};

export default DisplayAssignments;
