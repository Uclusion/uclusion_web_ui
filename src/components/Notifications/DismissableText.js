import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl'
import IconButton from '@material-ui/core/IconButton';
import LiveHelpTwoToneIcon from '@material-ui/icons/LiveHelpTwoTone';
import CancelRoundedIcon from '@material-ui/icons/CancelRounded';
import { makeStyles } from '@material-ui/styles';
import { AccountUserContext } from '../../contexts/AccountUserContext/AccountUserContext'
import { getUiPreferences, userIsLoaded } from '../../contexts/AccountUserContext/accountUserContextHelper'
import { updateUiPreferences } from '../../api/account'
import { accountUserRefresh } from '../../contexts/AccountUserContext/accountUserContextReducer'
import { Checkbox, Typography } from '@material-ui/core'

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    backgroundColor: theme.palette.grey["300"],
    borderRadius: 6,
    padding: 0,
  },
  leftMost: {
    margin: 0,
    marginLeft: theme.spacing(1),
    fontSize: 16,
    flex: 10.5,
    padding: '14px',
    display: 'flex'
  },
  rightMost: {
    flex: 1.5,
    marginLeft: 'auto',
    margin: 0,
    display: 'flex',
    justifyContent: 'flex-end'
  },
  dismissText: {
    transform: 'scale(0.7)',
    margin: 0,
    display: 'flex',
    flexDirection: 'row',
    justifyContent: 'flex-end'
  },
  pointer: {
    cursor: 'pointer',
    textDecoration: 'underline'
  },
  hoverState: {
    '&:hover': {
      backgroundColor: "transparent",
    }
  },
  help: {
    marginRight: '6px'
  }
}));

function DismissableText(props) {
  const {
    text, checkBoxFunc, textId
  } = props;
  const classes = useStyles();
  const intl = useIntl();
  const [checkBoxValue, setCheckBoxValue] = useState(false);
  const [userState, userDispatch] = useContext(AccountUserContext);
  const hasUser = userIsLoaded(userState)
  const userPreferences = getUiPreferences(userState) || {};
  const previouslyDismissed = userPreferences.dismissedText || [];
  const cantShow = !hasUser || previouslyDismissed.includes(textId);

  function storeDismissedInBackend() {
    const newDismissed = [...previouslyDismissed, textId];
    const newPreferences = {
      ...userPreferences,
      dismissedText: newDismissed
    };
    return updateUiPreferences(newPreferences)
      .then((result) => {
        const { user } = result;
        userDispatch(accountUserRefresh(user));
      });
  }

  function controlShowAgainToggle() {
    if (checkBoxValue) {
      setCheckBoxValue(false);
      checkBoxFunc(undefined);
    } else {
      setCheckBoxValue(true);
      // https://medium.com/swlh/how-to-store-a-function-with-the-usestate-hook-in-react-8a88dd4eede1
      checkBoxFunc(() => () => storeDismissedInBackend());
    }
  }

  if (cantShow) {
    return React.Fragment;
  }

  if (checkBoxFunc) {
    return (
      <div style={{marginLeft: '1rem', marginRight: '0.5rem', paddingTop: '0.25rem'}}>
        <Typography>
          {intl.formatMessage({ id: 'doNotShowAgain' })}
          <Checkbox
            style={{maxHeight: '1rem'}}
            id="showAgain"
            name="showAgain"
            checked={checkBoxValue}
            onChange={controlShowAgainToggle}
          />
        </Typography>
      </div>
    )
  }

  return (
    <dl className={classes.root} >
      <dl className={classes.leftMost}>
        <LiveHelpTwoToneIcon color="inherit" fontSize="small" className={classes.help}/>
        {text}
      </dl>
      <dl className={classes.rightMost}>
        <dd className={classes.dismissText}>
          <span role="button" onClick={storeDismissedInBackend} className={classes.pointer}>
            <FormattedMessage id="decisionDialogsDismissDialog" />
            <IconButton className={classes.hoverState} disableRipple>
              <CancelRoundedIcon />
            </IconButton>
          </span>
        </dd>
      </dl>
    </dl>
  );
}

DismissableText.propTypes = {
  textId: PropTypes.string.isRequired,
  text: PropTypes.element,
  checkBoxFunc: PropTypes.func
};

export default DismissableText;
