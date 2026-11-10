/**
 * The "I am human" check (Cloudflare Turnstile) for the email signup and resend calls.
 * It only produces a single-use token; the SSO server decides whether the request goes through.
 */
import React, { forwardRef, useEffect, useImperativeHandle, useRef } from 'react';
import PropTypes from 'prop-types';
import config from '../../config';

const TURNSTILE_SCRIPT_URL = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';

let turnstileLoad;

function loadTurnstile() {
  if (window.turnstile) {
    return Promise.resolve(window.turnstile);
  }
  if (!turnstileLoad) {
    turnstileLoad = new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = TURNSTILE_SCRIPT_URL;
      script.async = true;
      script.onload = () => {
        if (window.turnstile) {
          resolve(window.turnstile);
        } else {
          reject(new Error('Turnstile script loaded without starting'));
        }
      };
      script.onerror = () => {
        script.remove();
        reject(new Error('Turnstile script failed to load'));
      };
      document.head.appendChild(script);
    }).catch((error) => {
      // A later mount may try again
      turnstileLoad = undefined;
      throw error;
    });
  }
  return turnstileLoad;
}

const HumanCheck = forwardRef(function HumanCheck(props, ref) {
  const { onToken, onExpired, onUnavailable } = props;
  const containerRef = useRef(null);
  const widgetIdRef = useRef(undefined);
  const callbacksRef = useRef({ onToken, onExpired, onUnavailable });
  callbacksRef.current = { onToken, onExpired, onUnavailable };

  useImperativeHandle(ref, () => ({
    // Each token works only once, so the widget is reset after every submission.
    // Returns whether there was a widget to reset.
    reset() {
      if (widgetIdRef.current !== undefined && window.turnstile) {
        window.turnstile.reset(widgetIdRef.current);
        return true;
      }
      return false;
    }
  }), []);

  useEffect(() => {
    let active = true;
    function reportUnavailable(error) {
      if (active) {
        console.warn('Human check unavailable', error);
        callbacksRef.current.onUnavailable();
      }
    }
    loadTurnstile().then((turnstile) => {
      if (!active || !containerRef.current) {
        return;
      }
      try {
        widgetIdRef.current = turnstile.render(containerRef.current, {
          sitekey: config.turnstileSiteKey,
          callback: (token) => active && callbacksRef.current.onToken(token),
          'expired-callback': () => active && callbacksRef.current.onExpired(),
          'timeout-callback': () => active && callbacksRef.current.onExpired(),
          'error-callback': (errorCode) => {
            reportUnavailable(errorCode);
            // Handled here, so Turnstile does not also throw
            return true;
          },
        });
      } catch (error) {
        reportUnavailable(error);
      }
    }).catch(reportUnavailable);
    return () => {
      active = false;
      const widgetId = widgetIdRef.current;
      widgetIdRef.current = undefined;
      if (widgetId !== undefined && window.turnstile) {
        window.turnstile.remove(widgetId);
      }
    };
  }, []);

  return (
    <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', minHeight: '65px' }}
         ref={containerRef}/>
  );
});

HumanCheck.propTypes = {
  onToken: PropTypes.func.isRequired,
  onExpired: PropTypes.func.isRequired,
  onUnavailable: PropTypes.func.isRequired,
};

export default HumanCheck;
