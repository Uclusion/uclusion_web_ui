import WorkListItem from './WorkListItem'
import React from 'react'
import { useIntl } from 'react-intl'
import { nameFromDescription } from '../../../utils/stringFunctions'

function Outbox(props) {
  const { messagesOrdered, inboxState, inboxDispatch } = props;
  const { expansionState } = inboxState;
  const intl = useIntl();

  let rows = messagesOrdered.map((message) => {
    if (!message.isOutboxType) {
      return React.Fragment;
    }
    const { id, investible, updatedAt, title, icon, comment, debtors, expansionPanel } = message;
    const item = {
      title,
      read: true,
      isDeletable: false,
      people: debtors,
      date: intl.formatDate(updatedAt),
      expansionPanel,
      icon,
      message
    }

    if (investible) {
      item.investible = investible;
    }
    if (comment) {
      const commentName = nameFromDescription(comment);
      if (commentName) {
        item.comment = commentName;
      }
    }
    return <WorkListItem key={`outboxRow${id}`} id={id} useSelect={false} {...item}
                         inboxDispatch={inboxDispatch} expansionOpen={!!expansionState[id]} />;
  });

  return (
    <div id="outbox">
      {rows}
    </div>
  );
}

export default Outbox;