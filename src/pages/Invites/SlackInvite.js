import React, { useEffect } from 'react';
import { useIntl } from 'react-intl';
import PropTypes from 'prop-types';
import { useHistory } from 'react-router';
import queryString from 'query-string';
import {
  navigate,
} from '../../utils/marketIdPathFunctions';
import Screen from '../../containers/Screen/Screen';
import { getAccountClient } from '../../api/uclusionClient';
import { ERROR, sendIntlMessage } from '../../utils/userMessage';

function SlackInvite(props) {
  const { hidden } = props;
  const intl = useIntl();
  const history = useHistory();
  const { location } = history;
  const { hash } = location;

  useEffect(() => {
    if (!hidden) {
      const values = queryString.parse(hash);
      const { nonce } = values;
      if (nonce) {
        getAccountClient()
          .then((client) => client.users.register(nonce))
          .then(() => navigate(history, '/'))
          .catch((error) => {
            console.error(error);
            sendIntlMessage(ERROR, { id: 'slack_register_failed' });
          });
      }
    }
  }, [hidden, hash, history]);

  return (
    <Screen
      title={intl.formatMessage({ id: 'loadingSlack' })}
      tabTitle={intl.formatMessage({ id: 'loadingSlack' })}
      hidden={hidden}
      loading
    >
      <div />
    </Screen>
  );
}

SlackInvite.propTypes = {
  hidden: PropTypes.bool,
};

SlackInvite.defaultProps = {
  hidden: false,
};

export default SlackInvite;
