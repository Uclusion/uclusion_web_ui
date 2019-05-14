/**
 Help movies integrate with the ui preferences of the user
 They take the NAME of the movie (eg main investibles) and the user object
 as well as dispatch, and state, and track when you've seen the movie for you.
 Video locations are stored in app config, so you must update the name to vid source
 url to create a new movie and have it play
 E.G. once the user has watched it, we don't auto open it later
 We ALSO let you override the open etc, so you can play it when you
 need to from a link
 * */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import { getCurrentUser } from '../../store/Users/reducer';
import withAppConfigs from '../../utils/withAppConfigs';
import ModalMovie from './ModalMovie';
import { withMarketId } from '../PathProps/MarketId';
import { getUiPreference, setUiPreference } from '../../utils/userPreferencesFunctions';
import { updateUserUiPrefereneces } from '../../store/Users/actions';
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../utils';

function HelpMovie(props) {
  const {
    dispatch,
    name,
    open,
    user,
    appConfig,
    marketId,
    dontAutoOpen,
    onClose,
  } = props;

  const helpMoviesSeen = 'helpMoviesSeen';

  function getMovieUrl(name) {
    const { helpMovies } = appConfig;
    return helpMovies[name];
  }

  function getMoviePrefs(user) {
    return getUiPreference(user, helpMoviesSeen);
  }

  function getHasUserSeen() {
    // first check local storage. If it says they have seen, then don't play
    const moviesList = getUclusionLocalStorageItem(helpMoviesSeen) || {};
    const seenMovie = moviesList[name];
    if (seenMovie) {
      return true;
    }
    if (user) {
      const moviePrefs = getMoviePrefs(user);
      return moviePrefs && moviePrefs[name];
    }
    return false;
  }

  function getShouldBeOpen() {
    if (open) {
      return true;
    }
    if (dontAutoOpen) {
      return false;
    }
    const userSeen = getHasUserSeen();
    return !userSeen;
  }

  function setNewUiPreferences() {
    const moviePrefs = getUiPreference(helpMoviesSeen) || {};
    moviePrefs[name] = true;
    return setUiPreference(user, helpMoviesSeen, moviePrefs);
  }

  function updateUserPrefs() {
    const newUser = setNewUiPreferences();
    dispatch(updateUserUiPrefereneces({ user: newUser, marketId }));
  }

  function myOnClose() {
    if (!dontAutoOpen) {
      // special hack to make sure the video really isn't seen more than once
      const moviesList = getUclusionLocalStorageItem(helpMoviesSeen) || {};
      moviesList[name] = true;
      setUclusionLocalStorageItem(helpMoviesSeen, moviesList);
      if (user) {
        updateUserPrefs();
      }
    }
    if (onClose) {
      onClose();
    }
  }

  const movieUrl = getMovieUrl(name);
  const shouldBeOpen = getShouldBeOpen();

  return (
    <ModalMovie
      url={movieUrl}
      onClose={myOnClose}
      autoPlay
      open={shouldBeOpen}
    />
  );
}

HelpMovie.propTypes = {
  dispatch: PropTypes.func.isRequired,
  name: PropTypes.string.isRequired,
  // eslint-disable-next-line react/require-default-props
  open: PropTypes.bool,
  // eslint-disable-next-line react/require-default-props
  dontAutoOpen: PropTypes.bool,
  // eslint-disable-next-line react/forbid-prop-types
  appConfig: PropTypes.object.isRequired,
  marketId: PropTypes.string.isRequired,
  // eslint-disable-next-line react/forbid-prop-types
  user: PropTypes.object.isRequired,
  onClose: PropTypes.func,
};

function mapStateToProps(state) {
  return {
    user: getCurrentUser(state.usersReducer),
  };
}

function mapDispatchToProps(dispatch) {
  return { dispatch };
}

export default connect(
  mapStateToProps,
  mapDispatchToProps,
)(withMarketId(withAppConfigs(HelpMovie)));
