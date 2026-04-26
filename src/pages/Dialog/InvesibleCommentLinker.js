import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types'
import { makeStyles } from '@material-ui/styles'
import { useIntl } from 'react-intl'
import { Button, IconButton, Tooltip } from '@material-ui/core'
import { InvestiblesContext } from '../../contexts/InvestibesContext/InvestiblesContext'
import { getMarketInfo } from '../../utils/userFunctions'
import { getInvestible } from '../../contexts/InvestibesContext/investiblesContextHelper'
import LinkIcon from '@material-ui/icons/Link'
import FileCopyIcon from '@material-ui/icons/FileCopy'
import { getComment } from '../../contexts/CommentsContext/commentsContextHelper'
import { CommentsContext } from '../../contexts/CommentsContext/CommentsContext'
import { preventDefaultAndProp } from '../../utils/marketIdPathFunctions';
import { stripHTML } from '../../utils/stringFunctions'

const useStyles = makeStyles(() => ({
  hidden: {
    display: 'none',
  },
  inlinePill: {
    display: 'inline-flex',
    alignItems: 'center',
    verticalAlign: 'middle',
  },
  iconButton: {
    '&:hover': {
      backgroundColor: 'rgba(45,128,237,0.12)',
    },
  },
  iconButtonTight: {
    padding: 6,
  },
  copyButton: {
    '&:hover': {
      backgroundColor: 'rgba(45,128,237,0.12)',
    },
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

function transformTicketCode(inputString) {
  if (!inputString) {
    return inputString;
  }
  const allMatches = inputString.split('-');
  if (allMatches.length < 3) {
    return inputString;
  }
  return `${allMatches[0]}-${allMatches[2]}`;
}

function InvesibleCommentLinker(props) {
  const intl = useIntl();
  const {
    hidden = false,
    investibleId,
    commentId,
    marketId,
    flushLeft,
    flushBottom,
    textColor
  } = props;
  const classes = useStyles();
  const [investiblesState] = useContext(InvestiblesContext);
  const [commentState] = useContext(CommentsContext);
  const [copiedToClipboard, setCopiedToClipboard] = useState(false);
  const [copiedMessageToClipboard, setCopiedMessageToClipboard] = useState(false);
  const [copiedCodeToClipboard, setCopiedCodeToClipboard] = useState(false);
  const [inLinker, setInLinker] = useState(false);
  const [inMessageCopy, setInMessageCopy] = useState(false);
  const [inCodeCopy, setInCodeCopy] = useState(false);
  const inv = getInvestible(investiblesState, investibleId);
  const comment = getComment(commentState, marketId, commentId) || {};
  const marketInfo = getMarketInfo(inv, marketId) || {};
  let ticketCode = marketInfo.ticket_code;
  let link = `${window.location.protocol}//${window.location.host}/${marketId}/${ticketCode}`;
  let useTextInsteadOfLink = false;
  let commitMessage = '';
  let decodedTicketCode = decodeURI(ticketCode);
  let shortTicketCode = transformTicketCode(decodedTicketCode);
  if (commentId) {
    if (comment.ticket_code) {
      ticketCode = comment.ticket_code;
      decodedTicketCode = decodeURI(ticketCode);
      shortTicketCode = transformTicketCode(decodedTicketCode);
      link = `${window.location.protocol}//${window.location.host}/${marketId}/${comment.ticket_code}`;
    } else {
      useTextInsteadOfLink = true;
      link = `${window.location.href}#c${commentId}`;
    }
    commitMessage = `${decodedTicketCode} ${stripHTML(comment.body)}`;
  } else {
    commitMessage = `${decodedTicketCode} ${inv.investible.name}`;
  }
  return (
    <div
      id="inviteLinker"
      className={`${classes.inlinePill} ${hidden ? classes.hidden : ''}`}
      style={{ marginBottom: flushBottom ? 0 : '1rem' }}
    >
        <IconButton
          className={`${classes.iconButton} ${classes.iconButtonTight}`}
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
          className={classes.copyButton}
          style={{textTransform: 'none', justifyContent: 'left', whiteSpace: 'nowrap', color: textColor,
            paddingLeft: 0, paddingRight: 4, minWidth: 0}} disableRipple={true}
                onClick={(event) => {
                  preventDefaultAndProp(event);
                  navigator.clipboard.writeText(commitMessage);
                  setCopiedMessageToClipboard(true);
                }} onMouseLeave={() => {
                  setInMessageCopy(false);
                  setCopiedMessageToClipboard(false);
                }} onMouseEnter={() => setInMessageCopy(true)}>
            { !useTextInsteadOfLink ? shortTicketCode
                : intl.formatMessage({ id: 'copyCommitMessage' }) }
        </Button>
      </Tooltip>
      {!useTextInsteadOfLink && decodedTicketCode ? (
        <IconButton
          className={`${classes.iconButton} ${classes.iconButtonTight}`}
          style={{textTransform: 'none', justifyContent: 'left', whiteSpace: 'nowrap', marginLeft: 0, padding: 2}}
          disableRipple={true}
          onClick={(event) => {
            preventDefaultAndProp(event);
            navigator.clipboard.writeText(decodedTicketCode);
            setCopiedCodeToClipboard(true);
          }}
          onMouseLeave={() => {
            setInCodeCopy(false);
            setCopiedCodeToClipboard(false);
          }}
          onMouseEnter={() => setInCodeCopy(true)}
        >
          <Tooltip title={
            <h3>
              {intl.formatMessage({
                id: inCodeCopy && copiedCodeToClipboard ? 'codeOnlyCopied' : 'codeOnlyDirections',
              })}
            </h3>
          } placement="top">
            <FileCopyIcon htmlColor="#2F80ED" style={{ fontSize: 14 }} />
          </Tooltip>
        </IconButton>
      ) : null}
    </div>
  );
}

InvesibleCommentLinker.propTypes = {
  hidden: PropTypes.bool
};

export default InvesibleCommentLinker;
