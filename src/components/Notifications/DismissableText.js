import React, { useContext, useState } from 'react'
import PropTypes from 'prop-types';
import { FormattedMessage, useIntl } from 'react-intl'
import IconButton from '@material-ui/core/IconButton';
import LiveHelpTwoToneIcon from '@material-ui/icons/LiveHelpTwoTone';
import CancelRoundedIcon from '@material-ui/icons/CancelRounded';
import { makeStyles } from '@material-ui/styles';
import { getUiPreferences, userIsLoaded } from '../../contexts/AccountContext/accountUserContextHelper'
import { updateUiPreferences } from '../../api/account'
import { Checkbox, Typography } from '@material-ui/core'
import { AccountContext } from '../../contexts/AccountContext/AccountContext'
import { accountUserRefresh } from '../../contexts/AccountContext/accountContextReducer'

const useStyles = makeStyles(theme => ({
  root: {
    display: "flex",
    backgroundColor: theme.palette.grey["300"],
    borderRadius: 6,
    padding: 0,
  },
  rootEmpty: {
    display: "flex",
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: '1rem',
  },
  leftMost: {
    margin: 0,
    marginLeft: theme.spacing(1),
    fontSize: 16,
    flex: 10.5,
    padding: '14px',
    display: 'flex'
  },
  center: {
    fontSize: 16,
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
    text, checkBoxFunc, textId, display
  } = props;
  const classes = useStyles();
  const intl = useIntl();
  const [checkBoxValue, setCheckBoxValue] = useState(false);
  const [userState, userDispatch] = useContext(AccountContext);
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

  if (cantShow || display === false) {
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
    <dl className={display === true ? classes.rootEmpty : classes.root} >
      <dl className={display === true ? classes.center : classes.leftMost}>
        <LiveHelpTwoToneIcon htmlColor="#4ce6a5" fontSize="medium" className={classes.help}/>
        {text}
      </dl>
      {display === undefined && (
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
      )}
    </dl>
  );
}

DismissableText.propTypes = {
  textId: PropTypes.string.isRequired,
  text: PropTypes.element,
  checkBoxFunc: PropTypes.func
};

export default DismissableText;
