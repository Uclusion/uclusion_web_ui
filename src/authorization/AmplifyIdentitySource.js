/*
 This class serves as an identity provider for use by the token manager.

 Since we have our entire app wrapped by an amplify HOC, we're  guaranteed the identity
 exists before we get here. Therefore we can just fetch the current id token
 out of the current auth session.
*/

import { Auth } from 'aws-amplify';

class AmplifyIdentitySource {
  getIdentity() {
    return Auth.currentSession.then(sessionData => sessionData.idToken);
  }
}

export default AmplifyIdentitySource;
