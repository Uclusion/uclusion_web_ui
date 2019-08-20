const awsconfig = {
  Auth: {
    region: process.env.REACT_APP_AWS_REGION,
    userPoolId: process.env.REACT_APP_AWS_USER_POOL_ID,
    userPoolWebClientId: process.env.REACT_APP_AWS_CLIENT_ID,
    mandatorySignIn: true,
  },
};

export default awsconfig;
