import React, { useContext } from 'react'
import { Dialog } from '../Dialogs';
import { FormattedMessage, useIntl } from 'react-intl'
import PropTypes from 'prop-types';
import { Announcement, PlayArrow } from '@material-ui/icons'
import SpinningIconLabelButton from '../Buttons/SpinningIconLabelButton'
import { completeTour, isTourCompleted, SIGNUP_HOME } from '../../contexts/TourContext/tourContextHelper'
import { TourContext } from '../../contexts/TourContext/TourContext'
import _ from 'lodash';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions'
import { useHistory } from 'react-router'
import { makeStyles } from '@material-ui/core/styles'
import Typography from '@material-ui/core/Typography'

const myStyles = makeStyles(
  () => {
    return {
      root: {
        '& .MuiDialogTitle-root': {
          flex: '0 0 auto',
        },
      },
      title: {
        fontWeight: 'bold',
        textTransform: "capitalize",
        display: "flex",
        justifyContent: "center",
        "& h2": {
          display: "flex",
          alignItems: "center"
        }
      },
      titleIcon: {
        height: 16,
        width: 16,
        marginRight: 8,
      },
      warningTitleIcon: {
        marginRight: 8,
        color: '#F2C94C',
      },
      content: {
        fontSize: '1.2rem',
        paddingBottom: '1rem'
      },
      issueWarningContent: {
        lineHeight: 3,
        minWidth: '35rem',
        textAlign: "center"
      },
      actions: {
        flexBasis: "unset",
        justifyContent: "center"
      },
    };
  },
  { name: "LockedDialog" }
);

function CreatedWorkspaceDialog(props) {
  const { planningDetails, user } = props;
  const history = useHistory();
  const intl = useIntl();
  const classes = myStyles();
  const { name } = user;
  const autoFocusRef = React.useRef(null);
  const [tourState, tourDispatch] = useContext(TourContext);
  const isCompleted = isTourCompleted(tourState, SIGNUP_HOME);
  const open = !isCompleted && _.size(planningDetails) === 1;

  function onClose() {
    completeTour(tourDispatch, SIGNUP_HOME);
    const { id: marketId } = planningDetails[0];
    navigate(history, formMarketLink(marketId));
  }

  return (
    <Dialog
      autoFocusRef={autoFocusRef}
      classes={{
        root: classes.root,
        actions: classes.actions,
        content: classes.issueWarningContent,
        title: classes.title
      }}
      open={open}
      onClose={onClose}
      /* slots */
      actions={
        <div style={{paddingBottom: '1rem'}}>
          <SpinningIconLabelButton onClick={onClose} doSpin={false} icon={PlayArrow} ref={autoFocusRef}>
            <FormattedMessage id="createdWorkspaceStart" />
          </SpinningIconLabelButton>
        </div>
      }
      content={
        <Typography variant="h6" className={classes.content}>
          {intl.formatMessage({ id: 'createdWorkspaceContent' })}
        </Typography>
      }
      title={
        <div style={{paddingTop: '1rem'}}>
          <Announcement className={classes.warningTitleIcon} />
          {intl.formatMessage({ id: 'createdWorkspaceGreeting' }, { name })}
        </div>
      }
    />
  );
}

CreatedWorkspaceDialog.propTypes = {
  planningDetails: PropTypes.node.isRequired,
};

export default CreatedWorkspaceDialog;