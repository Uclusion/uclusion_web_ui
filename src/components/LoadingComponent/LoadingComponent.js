import React from 'react';

export const LoadingComponent = (props) => {
  if (props.isLoading) {
    // While our other component is loading...
    if (props.timedOut) {
      // In case we've timed out loading our other component.
      return <div>Loader timed out!</div>;
    }
    // Don't flash "Loading..." when we don't need to.
    return null;
  }
  if (props.error) {
    console.warn(props.error);

    // Reload page on first failed load
    if (window.location.href.indexOf('isReload') === -1) {
      window.location.href = `${window.location.href}?isReload=1`;
    }

    // If we aren't loading, maybe
    return <div>Error! Component failed to load</div>;
  }
  // This case shouldn't happen... but we'll return null anyways.
  return null;
};

export default LoadingComponent;
