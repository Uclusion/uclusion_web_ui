import React, { useContext } from 'react';
import { CognitoUserContext } from '../../contexts/CongitoUserContext';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import UpgradeForm from './UpgradeForm';

function UpgradeHome(props){
  const cognitoUser = useContext(CognitoUserContext);
  const account = useContext(AccountContext);

  const { name, sub, email } = cognitoUser;
  const { tier, id:accountId } = account;


  return (
    <div>
      Need some copy here telling them all the great benefits of upgrading to paid.
      We'll integrate stripe elements, and we have name email et all from our contexts.

    </div>
  )
  return (<React.Fragment/>);
}

export default UpgradeHome;