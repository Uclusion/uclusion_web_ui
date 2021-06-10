import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/styles'
import FileCopyIcon from '@material-ui/icons/FileCopy'
import { useIntl } from 'react-intl'
import { formInviteLink } from '../../utils/marketIdPathFunctions'
import { Divider, InputBase, Typography } from '@material-ui/core'
import TooltipIconButton from '../../components/Buttons/TooltipIconButton'
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../utils/userFunctions'
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'

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
    investibleId,
    marketId
  } = props;
  const classes = useStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { ticket_code: ticketCode } = marketInfo;
  function getDirectionsId() {
    switch (marketType) {
      case PLANNING_TYPE:
        return 'inviteLinkerDirectionsPlan';
      case DECISION_TYPE:
        return 'inviteLinkerDirectionsDecision';
      case INITIATIVE_TYPE:
        return 'inviteLinkerDirectionsInitiative';
      default:
        return 'inviteLinkerStory';
    }
  }
  const link = marketType === 'story' ? marketToken : formInviteLink(marketToken);
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
  const ticketCodeIcon = (
    <>
      <Divider className={classes.divider} orientation="vertical" />
      <TooltipIconButton
        translationId="inviteLinkerCopyToClipboard"
        icon={<FileCopyIcon htmlColor="#3f6b72"/>}
        onClick={() => navigator.clipboard.writeText(ticketCode)}
      />
    </>
  );
  return (
    <div
      id="inviteLinker"
      className={hidden ? classes.hidden : classes.linkContainer}
    >
      <Typography style={{width: '100%', paddingBottom: '0.5rem'}}>
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
      {ticketCode && marketType === 'story' && (
        <>
          <Typography style={{marginTop: '1rem', width: '100%'}}>
            { intl.formatMessage({ id: 'inviteLinkerTicketCode' }) }
          </Typography>
          <InputBase
            className={classes.inputField}
            fullWidth={true}
            placeholder={ticketCode}
            inputProps={{ 'aria-label': link, border: '1px solid #ccc' }}
            value={ticketCode}
            endAdornment={ticketCodeIcon}
            color={"primary"}
          />
        </>
      )}
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
