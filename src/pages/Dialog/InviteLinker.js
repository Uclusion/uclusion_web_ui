import React from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/styles';
import AssignmentIcon from '@material-ui/icons/Assignment';
import { useIntl } from 'react-intl';
import { formInviteLink } from '../../utils/marketIdPathFunctions';
import { Typography, InputBase, Divider } from '@material-ui/core';
import TooltipIconButton from '../../components/Buttons/TooltipIconButton';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';

const useStyles = makeStyles((theme) => ({
  hidden: {
    display: 'none',
  },
  linkContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column',
  },
  input: {
    width: '100%',
  },
  inputField: {
    width: '100%',
    border: '1px solid #ccc',
    paddingLeft: 15,
    borderRadius: 5,
  },
  divider: {
    height: 36,
    margin: 4,
  },
}));

function InviteLinker(props) {
  const intl = useIntl();
  const {
    marketId,
    hidden,
    observerLabel,
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
  const message = intl.formatMessage({ id: getDirectionsId() });
  const link = formInviteLink(marketId);
  const icon = (
    <>
    <Divider className={classes.divider} orientation="vertical" />
    <TooltipIconButton
      translationId="inviteLinkerCopyToClipboard"
      icon={<AssignmentIcon/>}
      onClick={() => navigator.clipboard.writeText(`${link}#is_obs=true`)}
    />
    </>
  );
  return (
    <div
      id="inviteLinker"
      className={hidden ? classes.hidden : classes.linkContainer}
    >
      <Typography className={classes.input}>{ message }</Typography>
      <InputBase
        className={classes.inputField}
        fullWidth={true}
        placeholder={link}
        inputProps={{ ariaLabel: link, border: '1px solid #ccc' }}
        value={link}
        endAdornment={icon}
        color={"primary"}
      />
    </div>
  );
}

InviteLinker.propTypes = {
  marketId: PropTypes.string.isRequired,
  observerLabel: PropTypes.string.isRequired,
  hidden: PropTypes.bool,
  marketType: PropTypes.string.isRequired,
};

InviteLinker.defaultProps = {
  hidden: false,
};

export default InviteLinker;
