import React from 'react';
import { injectIntl } from 'react-intl';
import PropTypes from 'prop-types';
import Activity from '../../containers/Activity';
import useNotificationsContext from '../../contexts/useNotificationsContext';
import NotificationsList from './NotificationsList';

function Notifications(props) {
  const { intl, hidden } = props;
  const { messages, isLoading } = useNotificationsContext();


  return (
    <Activity
      title={intl.formatMessage({ id: 'sidebarNavActionItems' })}
      isLoading={isLoading}
      hidden={hidden}
    >
      <div>
        asdsad
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
