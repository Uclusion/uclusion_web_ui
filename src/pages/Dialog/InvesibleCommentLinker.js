import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/styles'
import { useIntl } from 'react-intl'
import { Button, IconButton, Tooltip } from '@material-ui/core'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../utils/userFunctions'
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import LinkIcon from '@material-ui/icons/Link'
import { getComment } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { stripHTML } from '../../utils/stringFunctions'

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

function InvesibleCommentLinker(props) {
  const intl = useIntl();
  const {
    hidden,
    investibleId,
    commentId,
    marketId,
    flushLeft,
    flushBottom
  } = props;
  const classes = useStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentState] = useContext(CommentsContext);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [copiedMessageToClipboard, setCopiedMessageToClipboard] = useState(false);
  const [inLinker, setInLinker] = useState(false);
  const [inMessageCopy, setInMessageCopy] = useState(false);
  const inv = getInvestible(investiblesState, investibleId);
  const comment = getComment(commentState, marketId, commentId) || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  let ticketCode = marketInfo.ticket_code;
  let link = `${window.location.protocol}//${window.location.host}/${marketId}/${ticketCode}`;
  let useTextInsteadOfLink = false;
  let commitMessage = '';
  if (commentId) {
    if (comment.ticket_code) {
      ticketCode = comment.ticket_code;
      link = `${window.location.protocol}//${window.location.host}/${marketId}/${comment.ticket_code}`;
    } else {
      useTextInsteadOfLink = true;
      link = `${window.location.href}#c${commentId}`;
    }
    commitMessage = `${ticketCode} ${stripHTML(comment.body)}`;
  } else {
    commitMessage = `${ticketCode} ${inv.investible.name}`;
  }
  return (
    <div id="inviteLinker" className={hidden ? classes.hidden : undefined}
         style={{marginBottom: flushBottom ? 0 : undefined}}>
        <IconButton
          style={{textTransform: 'none', justifyContent: 'left', whiteSpace: 'nowrap',
            paddingLeft: flushLeft ? 0 : undefined}} 
            disableRipple={true}
                onClick={(event) => {
                  preventDefaultAndProp(event);
                  navigator.clipboard.writeText(link);
                  setCopiedToClipboard(true);
                }} onMouseLeave={() => {
                  setInLinker(false);
                  setCopiedToClipboard(false);
                }} onMouseEnter={() => setInLinker(true)}>
              <Tooltip title={
                  <h3>
                    {intl.formatMessage({
                      id: inLinker && copiedToClipboard ? 'inviteLinkerCopied': 'inviteLinkerDirectionsPlan' })}
                  </h3>
                } placement="top">
                  <LinkIcon htmlColor="#2F80ED" />
          </Tooltip>  
        </IconButton>
      <Tooltip title={
        <h3>
          {intl.formatMessage({
            id: inMessageCopy && copiedMessageToClipboard ? 'commitMessageCopied': 'commitMessageDirections' })}
        </h3>
      }
               placement="top">
        <Button
          style={{textTransform: 'none', justifyContent: 'left', whiteSpace: 'nowrap',
            paddingLeft: 0}} disableRipple={true}
                onClick={(event) => {
                  preventDefaultAndProp(event);
                  navigator.clipboard.writeText(commitMessage);
                  setCopiedMessageToClipboard(true);
                }} onMouseLeave={() => {
                  setInMessageCopy(false);
                  setCopiedMessageToClipboard(false);
                }} onMouseEnter={() => setInMessageCopy(true)}>
            { !useTextInsteadOfLink ? decodeURI(ticketCode)
                : intl.formatMessage({ id: 'copyCommitMessage' }) }
        </Button>
      </Tooltip>
    </div>
  );
}

InvesibleCommentLinker.propTypes = {
  hidden: PropTypes.bool
};

InvesibleCommentLinker.defaultProps = {
  hidden: false,
};

export default InvesibleCommentLinker;
