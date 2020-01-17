import React, { useEffect, useState } from 'react';
import _ from 'lodash';
import { verifyEmail } from '../../api/sso';
import { redirectToPath, setRedirect } from '../../utils/redirectUtils';
import { extractErrorJSON } from '../../api/errorUtils';
import { sendIntlMessage, ERROR } from '../../utils/userMessage';
import { useHistory } from 'react-router';


function VerifyEmail(props) {
  const LOGIN = '/';
  const history = useHistory();



  const params = (new URL(document.location)).searchParams;
  const [verificationState, setVerificationState] = useState(undefined);
  const code = params.get('code');

  useEffect(() => {
    function initiateRedirect() {
      setTimeout(() => {
        console.debug('redirecting you to login');
        redirectToPath(history, LOGIN);
      }, 5000);
    }
    if (code && !verificationState) {
      verifyEmail(code)
        .then((result) => {
          const { redirect } = result;
          if (!_.isEmpty(redirect)) {
            setRedirect(redirect);
          }
          setVerificationState('VERIFIED');
          initiateRedirect();
        })
        .catch((error) => {
          return extractErrorJSON(error)
            .then((errorData) => {
              const { error_message } = errorData;
              console.debug(error);
              if (error_message === 'Already verified') {
                initiateRedirect();
                setVerificationState('ALREADY_EXISTS');
              } else {
                sendIntlMessage(ERROR, 'errorVerifyFailed');
              }
            }).catch(() => {
              sendIntlMessage(ERROR, 'errorVerifyFailed');
            });
        });
    }
  }, [code, verificationState, history]);

  if (!code) {
    return (
      <div>
        No code was provided. Please provide a verification link from the email.
      </div>
    );
  }

  if (verificationState === 'ALREADY_EXISTS') {
    return (
      <div>
        This email has already been verified. We will be redirecting you to login shortly.
      </div>
    );
  }

  if (verificationState === 'VERIFIED') {
    return (
      <div>
        Verification was successful, and your account was created.
        We will be redirecting you to login shortly.
      </div>
    );
  }

  return (
    <div>
      We are verifying your email now.
    </div>
  );
}

export default VerifyEmail;
