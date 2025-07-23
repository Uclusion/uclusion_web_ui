import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import {
  getMarketPresences
} from '../../../contexts/MarketPresencesContext/marketPresencesHelper'
import {
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  ListItemSecondaryAction, ListItemIcon, Tooltip,
  Link
} from '@material-ui/core'
import BanUserButton from './BanUserButton';
import UnBanUserButton from './UnBanUserButton';
import { makeStyles } from '@material-ui/styles';
import Gravatar from '../../../components/Avatars/Gravatar';
import Typography from '@material-ui/core/Typography'
import { useIntl } from 'react-intl'
import Screen from '../../../containers/Screen/Screen';
import { ADD_COLLABORATOR_WIZARD_TYPE } from '../../../constants/markets';
import { navigate, preventDefaultAndProp } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router-dom/cjs/react-router-dom.min';

const useStyles = makeStyles((theme) => {
  return {
    manage: {
      width: '40%',
      marginLeft: '10rem',
      marginTop: '2rem',
      [theme.breakpoints.down('sm')]: {
        width: 'unset',
        marginLeft: 'unset'
      },
    },
    unbanned: {},
    banned: {
      color: "#ca2828",
    },
  };
});

function ManageMarketUsers(props) {
  const {
    market
  } = props;
  const {
    id: marketId
  } = market;
  const classes = useStyles();
  const intl = useIntl();
  const history = useHistory();
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const marketPresences = getMarketPresences(marketPresencesState, marketId, false,
    false) || [];

  function getUsers () {
    return marketPresences.map((presence) => {
      const { name, email, id, market_banned: banned } = presence;
      return (
        <ListItem
          key={id}
        >
          <ListItemAvatar>
            <Gravatar
              name={name}
              email={email}
              className={banned? classes.banned : classes.unbanned}
            />
          </ListItemAvatar>
          <ListItemText
            className={banned? classes.banned : classes.unbanned}
          >
            {name}
          </ListItemText>
          <ListItemSecondaryAction>
            {!banned && (
              <BanUserButton
                userId={id}
                marketId={marketId}
              />
            )}
            {banned && (
              <UnBanUserButton
                userId={id}
                marketId={marketId}
              />
            )}
          </ListItemSecondaryAction>
        </ListItem>
      );
    });
  }

  if (_.isEmpty(marketPresences)){
    return <React.Fragment/>
  }
  const pathAddCollaborator = `/wizard#type=${ADD_COLLABORATOR_WIZARD_TYPE.toLowerCase()}&marketId=${marketId}`;
  return (
    <Screen
      title={intl.formatMessage({ id: 'manage' })}
      tabTitle={intl.formatMessage({ id: 'manage' })}
      hidden={false}
      loading={_.isEmpty(market)}
    >
      <List className={classes.manage}
        subheader={
        <Typography align="center" variant="h6">
          {intl.formatMessage({ id: 'manage' })}
        </Typography>
      }>
        <ListItem key='header'><ListItemText />
          <Tooltip title={intl.formatMessage({ id: 'removeExplanation' })}>
            <ListItemIcon>Remove</ListItemIcon>
          </Tooltip>
        </ListItem>
        {getUsers()}
      </List>
      <Typography variant="body2" className={classes.manage} style={{paddingLeft: '2rem'}}>
          To add collaborators click <Link href={pathAddCollaborator} onClick={(event) => {
          preventDefaultAndProp(event);
          navigate(history, pathAddCollaborator);
        }}>here</Link>.
        </Typography>
    </Screen>
  );

}

ManageMarketUsers.propTypes = {
  market: PropTypes.object.isRequired,
};

export default ManageMarketUsers;