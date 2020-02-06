import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { useIntl } from 'react-intl';
import { formInviteLink } from '../../utils/marketIdPathFunctions';
import { Typography } from '@material-ui/core';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';

const useStyles = makeStyles((theme) => ({
  hidden: {
    display: 'none',
  },
  linker: {},
}));

function InviteLinker(props) {
  const intl = useIntl();
  const {
    marketId,
    hidden,
    observerLabel,
    showObserverLink,
    marketType,
  } = props;
  const classes = useStyles();

  function getDirectionsId() {
    switch (marketType) {
      case PLANNING_TYPE:
        return 'inviteLinkerDirectionsPlan';
      case DECISION_TYPE:
        return 'inviteLinkerDirectionsDecision';
      case INITIATIVE_TYPE:
        return 'inviteLinkerDirectionsInitiative';
      default:
        return 'inviteLinkerDirectionsDecision';
    }
  }

  const link = formInviteLink(marketId);
  return (
    <div
      id="inviteLinker"
      className={hidden ? classes.hidden : classes.linker}
    >
      <Typography>
        {intl.formatMessage({ id: getDirectionsId() })}
      </Typography>
      <Typography>
        {`${link}#is_obs=false`}
      </Typography>
      <TooltipIconButton
        translationId="inviteLinkerCopyToClipboard"
        icon={<AssignmentIcon/>}
        onClick={() => navigator.clipboard.writeText(`${link}#is_obs=false`)}
      />
      {showObserverLink && (
        <div>
          <Typography>
            {`${observerLabel} ${link}#is_obs=true`}
          </Typography>
          <TooltipIconButton
            translationId="inviteLinkerCopyToClipboard"
            icon={<AssignmentIcon/>}
            onClick={() => navigator.clipboard.writeText(`${link}#is_obs=true`)}
          />
        </div>
      )}
    </div>
  );
}

InviteLinker.propTypes = {
  marketId: PropTypes.string.isRequired,
  observerLabel: PropTypes.string.isRequired,
  hidden: PropTypes.bool,
  showObserverLink: PropTypes.bool,
  markeType: PropTypes.string.isRequired,
};

InviteLinker.defaultProps = {
  hidden: false,
  showObserverLink: true,
};

export default InviteLinker;
