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
import React, { useContext } from 'react'
import PropTypes from 'prop-types'
import ModalMovie from './ModalMovie'
import { getUclusionLocalStorageItem, setUclusionLocalStorageItem } from '../utils'
import { getUiPreferences } from '../../contexts/AccountUserContext/accountUserContextHelper'
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import { updateUiPreferences } from '../../api/account'
import { accountUserRefresh } from '../../contexts/AccountUserContext/accountUserContextReducer'
import config from '../../config/config'

function HelpMovie(props) {
  const {
    name,
    open,
    dontAutoOpen,
    onClose,
    canClose,
  } = props;
  const [userState, userDispatch] = useContext(AccountUserContext);
  const userPreferences = getUiPreferences(userState) || {};
  const helpMoviesSeen = userPreferences.helpMoviesSeen || [];

  function getMovieUrl(name) {
    const { helpMovies } = config;
    return helpMovies[name];
  }

  function getHasUserSeen() {
    // first check local storage. If it says they have seen, then don't play
    const moviesList = getUclusionLocalStorageItem(helpMoviesSeen) || {};
    if (moviesList[name]) {
      return true;
    }
    return helpMoviesSeen && helpMoviesSeen.find((entry) => entry === name);
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
    const newSeen = [...helpMoviesSeen, name];
    const newPreferences = {
      ...userPreferences,
      helpMoviesSeen: newSeen
    };
    updateUiPreferences(newPreferences)
      .then((result) => {
        const { user } = result;
        userDispatch(accountUserRefresh(user));
      });
  }

  function myOnClose() {
    if (!dontAutoOpen) {
      // special hack to make sure the video really isn't seen more than once
      const moviesList = getUclusionLocalStorageItem(helpMoviesSeen) || {};
      moviesList[name] = true;
      setUclusionLocalStorageItem(helpMoviesSeen, moviesList);
      setNewUiPreferences();
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
      canClose={canClose}
      open={shouldBeOpen}
    />
  );
}

HelpMovie.propTypes = {
  name: PropTypes.string.isRequired,
  open: PropTypes.bool,
  dontAutoOpen: PropTypes.bool,
  onClose: PropTypes.func,
  canClose: PropTypes.bool,
};

HelpMovie.defaultProps = {
  onClose: () => {},
  dontAutoOpen: false,
  open: false,
  canClose: true,
};

export default HelpMovie;
