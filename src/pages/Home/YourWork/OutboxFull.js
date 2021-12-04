import { useIntl } from 'react-intl'
import Screen from '../../../containers/Screen/Screen'
import PropTypes from 'prop-types'
import Outbox from './Outbox'

function OutboxFull(props) {
  const { hidden } = props;
  const intl = useIntl();

  return (
    <Screen
      title={intl.formatMessage({id: 'outbox'})}
      tabTitle={intl.formatMessage({id: 'outbox'})}
      hidden={hidden}
      isPending
    >
      <Outbox />
    </Screen>
  );
}

OutboxFull.propTypes = {
  hidden: PropTypes.bool.isRequired
}

export default OutboxFull;