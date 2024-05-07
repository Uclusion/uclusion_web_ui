import React, { useContext } from 'react';
import Toolbar from '@material-ui/core/Toolbar';
import {
  ArrowBack,
  ArrowForward
} from '@material-ui/icons';
import { formInboxItemLink, navigate } from '../../utils/marketIdPathFunctions';
import TooltipIconButton from '../Buttons/TooltipIconButton';
import { useHistory, useLocation } from 'react-router';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import { dehighlightMessage } from '../../contexts/NotificationsContext/notificationsContextHelper';
import { addNavigation, removeNavigation } from '../../contexts/NotificationsContext/notificationsContextReducer';
import _ from 'lodash';

export default function NavigationChevrons() {
  const history = useHistory();
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const location = useLocation();
  const { pathname, search, hash } = location;
  const resource = `${pathname}${search}${hash}`;
  const { messages, navigations } = messagesState || {};
  const allMessages = messages?.filter((message) => !message.deleted) || [];
  const highlightedMessages = allMessages.filter((message) => message.is_highlighted);
  const orderedNavigations = _.orderBy(navigations || [], ['time'], ['desc']);
  const allExistingUrls = allMessages.map((message) =>
    formInboxItemLink(message.type_object_id));
  const previous = _.find(orderedNavigations, (navigation) =>
    allExistingUrls.includes(navigation.url) && navigation.url !== resource);
  const backDisabled = _.isEmpty(previous);

  function doPreviousNavigation() {
    const url = previous?.url;
    if (url) {
      if (_.find(navigations, (navigation) => navigation.url === resource)) {
        // if you are currently on a navigation need to remove it so don't go back to it
        messagesDispatch(removeNavigation(resource));
      }
      messagesDispatch(removeNavigation(url));
      navigate(history, url);
    }
  }

  function doNextNavigation () {
    const highlightedNext = highlightedMessages.find((message) =>
      formInboxItemLink(message.type_object_id) !== resource);
    let url;
    if (highlightedNext) {
      dehighlightMessage(highlightedNext, messagesDispatch);
      url = formInboxItemLink(highlightedNext.type_object_id);
    }
    messagesDispatch(addNavigation(url));
    navigate(history, url);
  }

  return (
        <Toolbar>
          <TooltipIconButton disabled={backDisabled}
                             icon={<ArrowBack htmlColor={backDisabled ? 'disabled' : 'white'} />}
                             onClick={doPreviousNavigation} translationId="previousNavigation" />
          <div style={{marginLeft: '0.5rem'}}/>
          <TooltipIconButton icon={<ArrowForward htmlColor='white' />} onClick={doNextNavigation}
                             translationId="nextNavigation" />
        </Toolbar>

  );
}