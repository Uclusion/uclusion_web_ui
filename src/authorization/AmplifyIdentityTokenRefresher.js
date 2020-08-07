/*
 This class serves as an identity provider for use by the token manager.

 Since we have our entire app wrapped by an amplify HOC, we're  guaranteed the identity
 exists before we get here. Therefore we can just fetch the current id token
 out of the current auth session.
*/
import { Auth } from 'aws-amplify';

// import jwt_decode from 'jwt-decode';
class AmplifyIdentityTokenRefresher {
  getIdentity() {
    return Auth.currentSession().then((sessionData) => {
      const { idToken } = sessionData;
      const expired = idToken.getExpiration() <= (Date.now() / 1000);
      if (expired) {
        console.error("Id token is expired, and didn't auto refresh. Signing us out");
        return Auth.signOut();
      }
      const { jwtToken } = idToken;
      return jwtToken;
    });
  }
}

export default AmplifyIdentityTokenRefresher;
