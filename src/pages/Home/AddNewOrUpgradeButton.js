import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { canCreate } from '../../contexts/AccountContext/accountContextHelper';
import { useIntl } from 'react-intl';
import UpgradeToAddNew from './UpgradeToAddNew';
import { Button } from '@material-ui/core';


function AddNewOrUpgradeButton(props) {

  const [account] = useContext(AccountContext);
  const {
    onClick,
    className,
  } = props;

  const intl = useIntl();

  const createEnabled = canCreate(account);
  if (createEnabled) {
    return (
      <Button
        className={className}
        onClick={onClick}
        >
        {intl.formatMessage({ id: 'homeAddNew' })}
      </Button>
    );
  }

  return (
    <UpgradeToAddNew className={className}/>
  );

}

AddNewOrUpgradeButton.propTypes = {
  onClick: PropTypes.func,
  className: PropTypes.string,
}

AddNewOrUpgradeButton.defaultProps = {
  onClick: () => {},
  className: '',
}

export default AddNewOrUpgradeButton;