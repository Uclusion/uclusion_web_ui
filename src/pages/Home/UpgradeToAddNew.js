import React from 'react';
import { useIntl } from 'react-intl';
import { Button } from '@material-ui/core';
import { useHistory } from 'react-router';
import { navigate } from '../../utils/marketIdPathFunctions';

function UpgradeToAddNew (props) {

  const intl = useIntl();
  const {
    className
  } = props;
  const history = useHistory();

  function upgradeOnClick(){
    navigate(history, '/billing');
  }

  return (
    <Button
      className={className}
      onClick={upgradeOnClick}
    >
      {intl.formatMessage({id: 'upgradeNow'})}
    </Button>
  );

}

export default UpgradeToAddNew;