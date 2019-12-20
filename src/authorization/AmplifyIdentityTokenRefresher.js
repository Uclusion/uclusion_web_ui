/*
 This class serves as an identity provider for use by the token manager.

 Since we have our entire app wrapped by an amplify HOC, we're  guaranteed the identity
 exists before we get here. Therefore we can just fetch the current id token
 out of the current auth session.
*/
import jwt_decode from 'jwt-decode';
import { Auth } from 'aws-amplify';

// import jwt_decode from 'jwt-decode';
class AmplifyIdentityTokenRefresher {
  getIdentity() {
    return Auth.currentSession().then((sessionData) => {
      console.log(sessionData);
      const { idToken } = sessionData;
      const { jwtToken } = idToken;
      const decoded = jwt_decode(jwtToken);
      console.debug(decoded);
      const expDate = new Date(decoded.exp * 1000);
      console.log(new Date().toISOString());
      console.log(expDate.toISOString());
      return jwtToken;
    }).catch((error) => {
      console.log(error);
    });
  }
}

export default AmplifyIdentityTokenRefresher;
