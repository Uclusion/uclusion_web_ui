import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/styles'
import { useIntl } from 'react-intl'
import { Button, Tooltip } from '@material-ui/core'
import LinkIcon from '@material-ui/icons/Link'
import { getMarket } from '../../contexts/MarketsContext/marketsContextHelper'
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext'
import { formInviteLink } from '../../utils/marketIdPathFunctions'

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

function WorkspaceInviteLinker(props) {
  const intl = useIntl();
  const {
    hidden,
    marketId
  } = props;
  const classes = useStyles();
  const [marketsState] = useContext(MarketsContext);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [inLinker, setInLinker] = useState(false);
  const market = getMarket(marketsState, marketId) || {};
  const { market_token: marketToken } = market;

  let link = formInviteLink(marketToken);

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
             {intl.formatMessage({ id: 'copyInviteLink' }) }

        </Button>
      </Tooltip>
    </div>
  );
}

WorkspaceInviteLinker.propTypes = {
  hidden: PropTypes.bool
};

WorkspaceInviteLinker.defaultProps = {
  hidden: false,
};

export default WorkspaceInviteLinker;
