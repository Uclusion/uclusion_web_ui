import WorkListItem from './WorkListItem'
import React from 'react'
import { useIntl } from 'react-intl'
import { nameFromDescription } from '../../../utils/stringFunctions'
import _ from 'lodash'
import { Weekend } from '@material-ui/icons'

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

  if (_.isEmpty(rows)) {
    const item = {
      title: intl.formatMessage({ id: 'enjoy' }),
      market: intl.formatMessage({ id: 'noPending' }),
      icon: <Weekend style={{ fontSize: 24, color: '#2D9CDB', }}/>,
      read: false,
      isDeletable: false,
      message: { link: '/inbox' }
    };
    rows = [<WorkListItem key="emptyOutbox" id="emptyOutbox" useSelect={false} {...item} />]
  }

  return (
    <div id="outbox">
      {rows}
    </div>
  );
}

export default Outbox;