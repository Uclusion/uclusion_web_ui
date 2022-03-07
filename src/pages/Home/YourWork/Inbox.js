import WorkListItem, { workListStyles } from './WorkListItem'
import { Box, Checkbox, Fab, IconButton, useMediaQuery, useTheme } from '@material-ui/core'
import React, { useContext, useReducer } from 'react'
import { useIntl } from 'react-intl'
import { Assignment, ExpandLess, KeyboardArrowLeft, MoveToInbox, Weekend } from '@material-ui/icons'
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext'
import { navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import _ from 'lodash'
import Badge from '@material-ui/core/Badge'
import { makeStyles } from '@material-ui/styles'
import { deleteOrDehilightMessages } from '../../../api/users'
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext'
import ArchiveIcon from '@material-ui/icons/Archive'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import TooltipIconButton from '../../../components/Buttons/TooltipIconButton'
import { MarketsContext } from '../../../contexts/MarketsContext/MarketsContext'
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { getInboxCount, isInInbox } from '../../../contexts/NotificationsContext/notificationsContextHelper'
import ExpandMoreIcon from '@material-ui/icons/ExpandMore'
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext'
import { hasNoChannels } from '../../../contexts/MarketsContext/marketsContextHelper'
import InboxRow from './InboxRow'
import { getPaginatedItems } from '../../../utils/messageUtils'
import KeyboardArrowRight from '@material-ui/icons/KeyboardArrowRight'
import InboxWelcomeExpansion from './InboxWelcomeExpansion'

const useStyles = makeStyles(
  theme => {
    return {
      chip: {
        color: 'black',
        '& .MuiBadge-badge': {
          border: '0.5px solid grey',
          backgroundColor: '#fff',
        },
      },
      fab: {
        backgroundColor: '#fff',
        borderRadius: '50%',
        width: '48px',
        height: '48px',
        minHeight: '48px',
        [theme.breakpoints.down('sm')]: {
          width: '36px',
          height: '36px',
          minHeight: '36px'
        },
      },
      bellButton: {
        marginLeft: '0.5em',
        marginRight: '0.5em',
        marginTop: '0.5rem'
      }
    };
});

function Inbox(props) {
  const { isJarDisplay = false, isDisabled = false, expansionState, expansionDispatch, page, setPage } = props;
  const classes = useStyles();
  const intl = useIntl();
  const history = useHistory();
  const workItemClasses = workListStyles();
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [marketState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const [, , tokensHash] = useContext(MarketsContext);
  const [searchResults] = useContext(SearchResultsContext);
  const { results, parentResults, search } = searchResults;
  const theme = useTheme();
  const mobileLayout = useMediaQuery(theme.breakpoints.down('sm'));
  const [determinateState, determinateDispatch] = useReducer((state, action) => {
    const { determinate, checkAll } = state;
    const { type, id } = action;
    let newDeterminate = determinate;
    let newCheckAll = checkAll;
    if (type === 'clear') {
      newDeterminate = {};
      newCheckAll = false;
    } else if (type === 'toggle') {
      newCheckAll = !checkAll;
    } else if (id !== undefined) {
      const newValue = determinate[id] === undefined ? !checkAll : !determinate[id];
      if (newValue === checkAll) {
        newDeterminate = _.omit(determinate, id);
      } else {
        newDeterminate = {...determinate, [id]: newValue};
      }
    }
    let newIndeterminate = false;
    Object.keys(newDeterminate).forEach((key) => {
      if (newDeterminate[key] !== newCheckAll) {
        newIndeterminate = true;
      }
    });
    return { determinate: newDeterminate, indeterminate: newIndeterminate, checkAll: newCheckAll};
  }, {determinate: {}, indeterminate: false, checkAll: false});
  const { indeterminate, determinate, checkAll } = determinateState;
  const { messages: messagesUnsafe } = messagesState;
  let messagesFull = (messagesUnsafe || []).filter((message) => {
    return isInInbox(message, marketState, marketPresencesState, messagesUnsafe);
  });
  let messagesOrdered;
  if (isJarDisplay) {
    messagesOrdered = _.orderBy(messagesFull, [(message) => {
      const { level } = message;
      // Ignore read or not because not relevant to the priority of the inbox
      switch (level) {
        case 'RED':
          return 3;
        case 'YELLOW':
          return 2;
        default:
          return 1;
      }
      }], ['desc'] ) || [];
  } else {
    messagesOrdered =  _.orderBy(messagesFull, ['updated_at'], ['desc']) || [];
  }
  const goFullInboxClick = (event) => {
    preventDefaultAndProp(event);
    navigate(history, '/inbox');
  };
  if (isJarDisplay) {
    const unreadCount = getInboxCount(messagesState, marketState, marketPresencesState);
    const first = _.isEmpty(messagesFull) ? undefined : messagesOrdered[0];
    return (
      <div id='inboxNotification' key='inbox' onClick={goFullInboxClick} className={classes.bellButton}>
        <Badge badgeContent={unreadCount} className={classes.chip} overlap="circular">
          <Fab id='notifications-fabInbox' className={classes.fab} disabled={isDisabled}>
            <MoveToInbox
              htmlColor={ _.isEmpty(first) ? '#8f8f8f' :
                (first.level === 'RED' ? '#E85757' : (first.level === 'YELLOW' ? (isDisabled ? '#ffff00' :'#FCEC69')
                  : '#2D9CDB'))} />
          </Fab>
        </Badge>
      </div>
    );
  }

  const messagesFiltered = _.isEmpty(search) ? messagesOrdered : messagesOrdered.filter((message) => {
    const { type_object_id: typeObjectId,  investible_id: investibleId } = message;
    return results.find((result) => typeObjectId.endsWith(result.id) || result.id === investibleId) ||
      parentResults.find((id) => typeObjectId.endsWith(id) || parentResults.find((id) => investibleId === id));
  });
  const dupeHash = {};
  messagesFiltered.forEach((message) => {
    const { link_multiple: linkMultiple } = message;
    if (linkMultiple) {
      if (dupeHash[linkMultiple]) {
        dupeHash[linkMultiple].push(message);
      } else {
        dupeHash[linkMultiple] = [message];
      }
    }
  });
  messagesOrdered = messagesFiltered.filter((message) => {
    const { link_multiple: linkMultiple, level, type_object_id: typeObjectId } = message;
    if (dupeHash[linkMultiple]) {
      //Choose the message to use for the row icon color based on highest or equal priority
      return _.isEmpty(dupeHash[linkMultiple].find((aMessage) => {
        if (level === aMessage.level) {
          // Doesn't matter which so just do lexographic
          return aMessage.type_object_id > typeObjectId;
        }
        if (level === 'RED') {
          return false;
        }
        if (level === 'YELLOW') {
          return aMessage.level === 'RED';
        }
        return true;
      }));
    }
    return true;
  });

  function changePage(byNum) {
    setPage(page + byNum);
  }

  const { first, last, data, hasMore, hasLess } = getPaginatedItems(messagesOrdered, page);
  let defaultInboxRow = undefined;
  if (_.isEmpty(messagesOrdered)) {
    const id = 'emptyInbox';
    const { messages } = (messagesState || {});
    const safeMessages = messages || [];
    const existingMessage = safeMessages.find((message) => message.type_object_id === id)
      || { is_highlighted: true };
    if (hasNoChannels(tokensHash)) {
      const item = {
        title: intl.formatMessage({ id: 'welcome' }),
        market: intl.formatMessage({ id: 'aboutInbox' }),
        icon: <Assignment style={{fontSize: 24, color: '#2D9CDB',}}/>,
        read: !existingMessage.is_highlighted,
        message: {type_object_id: id, link: 'https://documentation.uclusion.com/notifications/inbox'},
        expansionPanel: <InboxWelcomeExpansion />,
        moreDescription: intl.formatMessage({ id: 'demonstratesInbox' }),
        date: intl.formatDate(new Date())
      };
      const determinateChecked = determinate[id];
      const checked = determinateChecked !== undefined ? determinateChecked : checkAll;
      defaultInboxRow = <WorkListItem key={id} id={id} expansionOpen={!!expansionState[id]}
                                      checked={checked} {...item}
                                      determinateDispatch={determinateDispatch} expansionDispatch={expansionDispatch}
      />;
    } else {
      defaultInboxRow = <WorkListItem key={id} id={id} useSelect={false} {...{
        title: intl.formatMessage({ id: 'enjoy' }),
        market: intl.formatMessage({ id: 'noNew' }),
        icon: <Weekend style={{fontSize: 24, color: '#2D9CDB',}}/>,
        read: false,
        date: intl.formatDate(new Date()),
        message: {link: '/outbox'}
      }} />;
    }
  }

  return (
    <div id="inbox">
      <div style={{display: 'flex', paddingBottom: '0.5rem'}}>
        {!mobileLayout && (
          <Checkbox style={{padding: 0, marginLeft: '0.6rem'}}
                    checked={checkAll}
                    indeterminate={indeterminate}
                    disabled={_.isEmpty(messagesOrdered)}
                    onChange={() => determinateDispatch({type: 'toggle'})}
          />
        )}
        {(checkAll || !_.isEmpty(determinate)) && (
          <TooltipIconButton
            icon={<ArchiveIcon htmlColor={ACTION_BUTTON_COLOR} />}
            onClick={() => {
               let toProcess = messagesFull.filter((message) => message.is_highlighted ||
                 message.type_object_id.startsWith('UNREAD'));
               if (checkAll) {
                 if (!_.isEmpty(determinate)) {
                   const keys = Object.keys(determinate);
                   toProcess = messagesFull.filter((message) => !keys.includes(message.type_object_id));
                 }
               } else {
                 const keys = Object.keys(determinate);
                 toProcess = messagesFull.filter((message) => keys.includes(message.type_object_id));
               }
               return deleteOrDehilightMessages(toProcess, messagesDispatch, workItemClasses.removed)
                 .then(() => {
                   determinateDispatch({type: 'clear'});
                 }).finally(() => {
                   setOperationRunning(false);
                 });
             }} translationId="inboxArchive" />
        )}
        <TooltipIconButton icon={<ExpandLess style={{marginLeft: '0.25rem'}} htmlColor={ACTION_BUTTON_COLOR} />}
                           onClick={() => expansionDispatch({expandAll: false})} translationId="inboxCollapseAll" />
        <TooltipIconButton icon={<ExpandMoreIcon style={{marginLeft: '0.25rem'}} htmlColor={ACTION_BUTTON_COLOR} />}
                           onClick={() => expansionDispatch({expandAll: true})} translationId="inboxExpandAll" />
        <div style={{flexGrow: 1}}/>
        <Box fontSize={14} color="text.secondary">
          {first} - {last} of {_.size(messagesOrdered) > 0 ? _.size(messagesOrdered) : 1}
          <IconButton disabled={!hasLess} onClick={() => changePage(-1)} >
            <KeyboardArrowLeft />
          </IconButton>
          <IconButton disabled={!hasMore} onClick={() => changePage(1)}>
            <KeyboardArrowRight />
          </IconButton>
        </Box>
      </div>
      {defaultInboxRow}
      { data.map((message) => {
        const { link_multiple: linkMultiple } = message;
        const linkMultiples = dupeHash[linkMultiple] || [];
        const numMultiples = _.size(_.uniqBy(linkMultiples, 'type'));
        const fullyVotedMessage = linkMultiples.find((message) => message.type === 'FULLY_VOTED');
        const isMultiple = !fullyVotedMessage && numMultiples > 1;
        const hasPersistent = linkMultiples.find((message) => !message.type_object_id.startsWith('UNREAD'));
        const useMessage = fullyVotedMessage || message;
        const determinateChecked = determinate[useMessage.type_object_id];
        const checked = determinateChecked !== undefined ? determinateChecked : checkAll;
        return <InboxRow message={useMessage} expansionDispatch={expansionDispatch} numMultiples={numMultiples}
                         determinateDispatch={determinateDispatch}
                         expansionOpen={!!expansionState[useMessage.type_object_id]}
                         hasPersistent={hasPersistent} isMultiple={isMultiple} checked={checked} />;
      }) }
    </div>
  );
}

export default React.memo(Inbox);