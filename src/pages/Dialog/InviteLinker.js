import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/styles'
import FileCopyIcon from '@material-ui/icons/FileCopy'
import { useIntl } from 'react-intl'
import { formInviteLink } from '../../utils/marketIdPathFunctions'
import { Button, Divider, InputBase, Link, Tooltip, Typography } from '@material-ui/core'
import TooltipIconButton from '../../components/Buttons/TooltipIconButton'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../utils/userFunctions'
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import LinkIcon from '@material-ui/icons/Link'

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
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [inLinker, setInLinker] = useState(false);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { ticket_code: ticketCode } = marketInfo;
  const link = marketType === 'story' ? marketToken : formInviteLink(marketToken);
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
    <div id="inviteLinker" className={hidden ? classes.hidden : undefined}>
      <Tooltip title={
        <h3>
          {intl.formatMessage({
            id: inLinker && copiedToClipboard ? 'inviteLinkerCopied': 'inviteLinkerDirectionsPlan' })}
        </h3>
      }
               placement="top">
        <Button style={{textTransform: 'none', justifyContent: 'left'}} disableRipple={true}
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  setCopiedToClipboard(true);
                }} onMouseLeave={() => {
                  setInLinker(false);
                  setCopiedToClipboard(false);
                }} onMouseEnter={() => setInLinker(true)}>
          <LinkIcon style={{marginRight: 6}} htmlColor="#339BFF" />
          <Link underline="none">
            { intl.formatMessage({ id: 'inviteLinkerText' }) }
          </Link>
        </Button>
      </Tooltip>
      {ticketCode && marketType === 'story' && (
        <div className={classes.linkContainer}>
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
        </div>
      )}
    </div>
  );
}

InviteLinker.propTypes = {
  marketToken: PropTypes.string.isRequired,
  hidden: PropTypes.bool
};

InviteLinker.defaultProps = {
  hidden: false,
};

export default InviteLinker;
