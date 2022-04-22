import WorkListItem from './WorkListItem'
import React from 'react'
import { useIntl } from 'react-intl'
import { nameFromDescription } from '../../../utils/stringFunctions'

function Outbox(props) {
  const { messagesOrdered, expansionState, expansionDispatch } = props;
  const intl = useIntl();

  let rows = messagesOrdered.map((message) => {
    const { id, investible, updatedAt, title, icon, comment, inActive, debtors, expansionPanel } = message;
    const item = {
      title,
      icon,
      read: !!inActive,
      isDeletable: false,
      people: debtors,
      date: intl.formatDate(updatedAt),
      expansionPanel,
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
                         expansionDispatch={expansionDispatch} expansionOpen={!!expansionState[id]} />;
  });

  return (
    <div id="outbox">
      {rows}
    </div>
  );
}

export default Outbox;