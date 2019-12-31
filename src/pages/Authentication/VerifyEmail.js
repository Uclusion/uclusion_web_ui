import React, { useEffect } from 'react';


function VerifyEmail(props) {

  const params = (new URL(document.location)).searchParams;
  const code = params.get('code');

  useEffect(() => {
    if (code) {

    }
  }, [code]);


  if (!code) {
    return (
      <div>
        No code was provided. Please provide a verification link from the email.
      </div>
    );
  }

  return <React.Fragment/>;
}

export default VerifyEmail;