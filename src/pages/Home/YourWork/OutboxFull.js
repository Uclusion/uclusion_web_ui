import { useIntl } from 'react-intl'
import Screen from '../../../containers/Screen/Screen'
import PropTypes from 'prop-types'
import Outbox from './Outbox'
import AddIcon from '@material-ui/icons/Add'

function OutboxFull(props) {
  const { hidden } = props;
  const intl = useIntl();

  const navigationMenu = {
    showSearch: false,
    navListItemTextArray: [
      {
        icon: AddIcon, text: intl.formatMessage({ id: 'homeAddInitiative' }),
        target: '/wizard#type=initiative'
      },
      {
        icon: AddIcon, text: intl.formatMessage({ id: 'homeAddDecision' }),
        target: '/wizard#type=dialog'
      },
    ]};
  return (
    <Screen
      title={intl.formatMessage({id: 'outbox'})}
      tabTitle={intl.formatMessage({id: 'outbox'})}
      hidden={hidden}
      navigationOptions={navigationMenu}
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