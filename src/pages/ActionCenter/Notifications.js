import React, { useContext } from 'react';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import Activity from '../../containers/Activity';
import { NotificationsContext } from '../../contexts/NotificationsContext/NotificationsContext';
import NotificationsList from './NotificationsList';

function Notifications(props) {
  const { intl, hidden } = props;
  const [messagesState] = useContext(NotificationsContext);
  const { messages } = messagesState;


  return (
    <Activity
      title={intl.formatMessage({ id: 'sidebarNavActionItems' })}
      isLoading={false}
      hidden={hidden}
    >
      <div>
        <NotificationsList messages={messages} />
      </div>
    </Activity>
  );
}

Notifications.propTypes = {
  // eslint-disable-next-line react/forbid-prop-types
  intl: PropTypes.object.isRequired,
};

export default injectIntl(Notifications);
