/*
 This class serves as an identity provider for use by the token manager.

 Since we have our entire app wrapped by an amplify HOC, we're  guaranteed the identity
 exists before we get here. Therefore we can just fetch the current id token
 out of the current auth session.
 Basic approach derived from here, with some fixes to their code not handing logical states
 right https://stackoverflow.com/questions/53375350/how-handle-refresh-token-service-in-aws-amplify-js
*/
import { Auth } from 'aws-amplify';

class AmplifyIdentityTokenRefresher {
  getIdentity () {
    return Auth.currentAuthenticatedUser().then((authedUser) => {
     // console.error(authedUser);
      if (!authedUser) {
        console.erorr('No authenticated user, logging us out');
        return Auth.signOut() // kick us back to the login screen, we don't have a user
      }
      const session = authedUser.getSignInUserSession();
      const idToken = session ? session.getIdToken() : null;
      // we don't have a token or we're expired, time to refresh or log us out if we can't
      if (!idToken || idToken.getExpiration() * 1000 < Date.now()) {
        console.warn('Amplify token expired, attempting to refresh');
        if (!session) {
          console.error('No session I can to refresh, logging us out');
          return Auth.signOut(); // I don't have a session, so no refresh token to work with
        }
        const refreshToken = session.getRefreshToken();
        // do the refresh, bridging the callback
        return new Promise((resolve) => {
          authedUser.refreshSession(refreshToken, (err, session) => {
            if (err) {
              console.error('Error refreshing the session, logging us out');
              resolve(Auth.signOut());
            }
            authedUser.setSignInUserSession(session);
            resolve(session.getIdToken().getJwtToken());
          });
        });
      }
      return session.getIdToken().getJwtToken();
    });
  }
}

export default AmplifyIdentityTokenRefresher;
