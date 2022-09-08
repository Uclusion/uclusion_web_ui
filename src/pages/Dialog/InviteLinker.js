import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/styles'
import { useIntl } from 'react-intl'
import { Button, Tooltip } from '@material-ui/core'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../utils/userFunctions'
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import LinkIcon from '@material-ui/icons/Link'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'

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
    hidden,
    investibleId,
    commentId,
    marketId
  } = props;
  const classes = useStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const [marketsState] = useContext(MarketsContext);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [inLinker, setInLinker] = useState(false);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { ticket_code: ticketCode } = marketInfo;
  const market = getMarket(marketsState, marketId) || {};
  let link = `${window.location.host}/${ticketCode}`;
  if (market.parent_comment_id) {
    link = `${window.location.href}/#option${investibleId}`;
  } else if (commentId) {
    link = `${window.location.href}/#c${commentId}`;
  }
  return (
    <div id="inviteLinker" className={hidden ? classes.hidden : undefined}>
      <Tooltip title={
        <h3>
          {intl.formatMessage({
            id: inLinker && copiedToClipboard ? 'inviteLinkerCopied': 'inviteLinkerDirectionsPlan' })}
        </h3>
      }
               placement="top">
        <Button
          variant="outlined"
          style={{textTransform: 'none', justifyContent: 'left'}} disableRipple={true}
                onClick={() => {
                  navigator.clipboard.writeText(link);
                  setCopiedToClipboard(true);
                }} onMouseLeave={() => {
                  setInLinker(false);
                  setCopiedToClipboard(false);
                }} onMouseEnter={() => setInLinker(true)}>
          <LinkIcon style={{marginRight: 6}}/>
             {intl.formatMessage({ id: 'copyLink' }) }

        </Button>
      </Tooltip>
    </div>
  );
}

InviteLinker.propTypes = {
  hidden: PropTypes.bool
};

InviteLinker.defaultProps = {
  hidden: false,
};

export default InviteLinker;
