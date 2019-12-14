import React from 'react';
import { SignIn } from 'aws-amplify-react';

class CustomSignIn extends SignIn {
  constructor(props) {
    super(props);
    this._validAuthStates = ['signIn', 'signedOut', 'signedUp'];
  }

  showComponent() {
    return (
      <div>
        <form>
          <div className="mb-4">
            <label
              htmlFor="username"
            >
              Username
            </label>
            <input
              id="username"
              key="username"
              name="username"
              onChange={this.handleInputChange}
              type="text"
              placeholder="Username"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
            >
              Password
            </label>
            <input
              id="password"
              key="password"
              name="password"
              onChange={this.handleInputChange}
              type="password"
              placeholder="******************"
            />
            <p className="text-grey-dark text-xs">
              Forgot your password?
              {' '}
              <a onClick={() => super.changeState('forgotPassword')}
              >
                Reset Password
              </a>
            </p>
          </div>
          <div>
            <button
              type="button"
              onClick={() => super.signIn()}
            >
              Login
            </button>
            <p className="text-grey-dark text-xs">
              No Account?
              {' '}
              <a onClick={() => super.changeState('signUp')}
              >
                Create account
              </a>
            </p>
          </div>
        </form>
      </div>
    );
  }
}

export default CustomSignIn;
