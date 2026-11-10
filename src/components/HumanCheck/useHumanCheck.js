import { useCallback, useRef, useState } from 'react';

/**
 * State for one HumanCheck widget. Spread humanCheckProps onto the widget.
 * ready is true once there is a token, or once the check reported it is unavailable,
 * in which case the form submits without a token and the server decides.
 */
export function useHumanCheck() {
  const humanCheckRef = useRef(null);
  const [token, setToken] = useState(undefined);
  const [unavailable, setUnavailable] = useState(false);

  const onToken = useCallback((newToken) => {
    setToken(newToken);
    setUnavailable(false);
  }, []);
  const onExpired = useCallback(() => setToken(undefined), []);
  const onUnavailable = useCallback(() => {
    setToken(undefined);
    setUnavailable(true);
  }, []);
  const reset = useCallback(() => {
    setToken(undefined);
    if (humanCheckRef.current?.reset()) {
      // A live widget runs the check again
      setUnavailable(false);
    }
  }, []);

  return {
    token,
    ready: !!token || unavailable,
    reset,
    humanCheckProps: { ref: humanCheckRef, onToken, onExpired, onUnavailable },
  };
}
