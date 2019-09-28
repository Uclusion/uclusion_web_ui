/**
 A compatibility identity source for when we _can't_ refresh a token
 **/

class NullIdentitySource {
  getIdentity() {
    return Promise.resolve('');
  }
}

export default NullIdentitySource;