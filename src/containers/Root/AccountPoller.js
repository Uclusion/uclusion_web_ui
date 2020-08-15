/**
 A simple component that only renders root if the home account user has been loaded in the contexts
 */

import React, { useContext, useEffect, useState } from 'react';
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext';
import { getAccount } from '../../api/sso';
import { userIsLoaded } from '../../contexts/AccountUserContext/accountUserContextHelper';
import { accountUserRefresh } from '../../contexts/AccountUserContext/accountUserContextReducer';
import { AccountContext } from '../../contexts/AccountContext/AccountContext';
import { updateAccount } from '../../contexts/AccountContext/accountContextHelper';
import { toastErrorAndThrow } from '../../utils/userMessage';
import Screen from '../Screen/Screen';
import { useIntl } from 'react-intl';

function AccountPoller (props) {

  const { children } = props;
  const [userState, userDispatch] = useContext(AccountUserContext);
  const [, accountDispatch] = useContext(AccountContext);
  const userLoaded = userIsLoaded(userState);
  const intl = useIntl();

  useEffect(() => {
    if (!userLoaded) {
      const maxRetries = 40;
      let currentRetries = 0;
      const poller = () => {
        getAccount()
          .then((loginInfo) => {
            const { user, account } = loginInfo;
            //might as well update the account too
            userDispatch(accountUserRefresh(user));
            updateAccount(accountDispatch, account);
          })
          .catch((error) => {
            if (currentRetries >= maxRetries) {
              toastErrorAndThrow(error, 'errorUserLoadFailed');
            }
            currentRetries += 1;
            setTimeout(poller, 500); // try every second
          });
      };
      poller(); //TODO, make a version of startTimerChain that supports an error message and catches
    }
  }, [accountDispatch, userDispatch, userLoaded]);

  if (userIsLoaded) {
    return <React.Fragment>{children}</React.Fragment>;
  }

  return (
    <Screen
      title="Uclusion"
      tabTitle={intl.formatMessage('loadingMessage')}
      loading={true}
    />);
}

export default AccountPoller;