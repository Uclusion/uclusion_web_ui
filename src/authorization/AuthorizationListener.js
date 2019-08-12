import { Hub } from 'aws-amplify';
import { postAuthTasks } from '../utils/postAuthFunctions';

/** Note:
 All the functions here might be needed even if we're just changing focus between chanels, or the user is moving away from the app
 **/

const AUTH_HUB_CHANNEL = 'auth';


class AuthorizationListener {
  /**
   * Listens for authorzation events, and configures the components with the right users etc when auth events happen
   * @param reduxDispatch
   * @param webSocket
   */
  constructor(reduxDispatch, webSocket){
    this.signInHappened = this.signInHappened.bind(this);
    this.listenForAuthorization = this.listenForAuthorization.bind(this);
  }

  signInHappened(payload) {
    console.log(`Handling user signin ${payload}`);
    postAuthTasks({ webSocket: this.webSocket, dispatch: this.reduxDispatch });
  }

  listenForAuthorization(reduxDispatch, webSocket) {
    console.log('begining listening');
    this.reduxDispatch = reduxDispatch;
    this.webSocket = webSocket;
    const me = this;
    Hub.listen(AUTH_HUB_CHANNEL, (data) => {
      const { payload } = data;
      const { event } = payload;
      console.log(event);
      switch (event) {
        case 'signIn':
          me.signInHappened(payload);
          break;
        default:
          break;
      }
    });
  }
}

export default AuthorizationListener;
