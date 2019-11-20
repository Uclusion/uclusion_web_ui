import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { useIntl } from 'react-intl';
import { formInviteLink } from '../../../utils/marketIdPathFunctions';
import { Typography } from '@material-ui/core';
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton';

const useStyles = makeStyles((theme) => ({
  hidden: {
    display: 'none',
  },
  linker: {},
}));

function InviteLinker(props) {
  const intl = useIntl();
  const { marketId, hidden } = props;
  const classes = useStyles();

  const link = formInviteLink(marketId);
  return (
    <div
      className={hidden ? classes.hidden : classes.linker}
    >
      <Typography>
        {intl.formatMessage({ id: 'inviteLinkerDirections' })}
      </Typography>
      <Typography>
        {link}
      </Typography>
      <TooltipIconButton
        translationId='inviteLinkerCopyToClipboard'
        icon={<AssignmentIcon />}
        onClick={() => navigator.clipboard.writeText(link)}
      />
    </div>
  );
}

InviteLinker.propTypes = {
  marketId: PropTypes.string.isRequired,
  hidden: PropTypes.bool,
};

InviteLinker.defaultProps = {
  hidden: false,
};

export default InviteLinker;
