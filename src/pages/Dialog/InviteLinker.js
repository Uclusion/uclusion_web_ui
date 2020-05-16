import React from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/styles'
import FileCopyIcon from '@material-ui/icons/FileCopy'
import { useIntl } from 'react-intl'
import { formInviteLink } from '../../utils/marketIdPathFunctions'
import { Divider, InputBase, Typography } from '@material-ui/core'
import TooltipIconButton from '../../components/Buttons/TooltipIconButton'
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'

const useStyles = makeStyles(() => ({
  hidden: {
    display: 'none',
  },
  linkContainer: {
    width: '100%',
    display: 'flex',
    flexDirection: 'column'
  },
  input: {
    width: '100%',
    marginBottom: 15,
  },
  inputField: {
    width: '100%',
    paddingLeft: 15,
    borderRadius: 8,
    backgroundColor: '#ecf0f1',
  },
  divider: {
    height: 36,
    margin: 4,
  },
}));

function InviteLinker(props) {
  const intl = useIntl();
  const {
    marketToken,
    hidden,
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
  const link = formInviteLink(marketToken);
  const icon = (
    <>
    <Divider className={classes.divider} orientation="vertical" />
    <TooltipIconButton
      translationId="inviteLinkerCopyToClipboard"
      icon={<FileCopyIcon htmlColor="#3f6b72"/>}
      onClick={() => navigator.clipboard.writeText(link)}
    />
    </>
  );
  return (
    <div
      id="inviteLinker"
      className={hidden ? classes.hidden : classes.linkContainer}
    >
      <Typography className={classes.input}>
        { intl.formatMessage({ id: getDirectionsId() }) }
      </Typography>
      <InputBase
        className={classes.inputField}
        fullWidth={true}
        placeholder={link}
        inputProps={{ 'aria-label': link, border: '1px solid #ccc' }}
        value={link}
        endAdornment={icon}
        color={"primary"}
      />
    </div>
  );
}

InviteLinker.propTypes = {
  marketToken: PropTypes.string.isRequired,
  hidden: PropTypes.bool,
  marketType: PropTypes.string.isRequired,
};

InviteLinker.defaultProps = {
  hidden: false,
};

export default InviteLinker;
