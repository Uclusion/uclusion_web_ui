import React, { useContext } from 'react';
import { ListItem, ListItemIcon, ListItemText, List, ListSubheader } from '@material-ui/core';
import PropTypes from 'prop-types';
import DescriptionOutlinedIcon from '@material-ui/icons/DescriptionOutlined';
import ChatIcon from '@material-ui/icons/Chat';
import { injectIntl } from 'react-intl';
import { withStyles } from '@material-ui/core/styles';
import { useHistory } from 'react-router';
import { formMarketLink, navigate } from '../../utils/marketIdPathFunctions';
import { getMarketDetailsForType } from '../../contexts/MarketsContext/marketsContextHelper';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import SidebarDecisions from '../../components/DecisionDialogs/SidebarDecisions';

const styles = theme => ({
  listItemIcon: {
    marginRight: 0,
  },
});


function NavItems(props) {
  const history = useHistory();
  const [marketsState] = useContext(MarketsContext);
  const marketDetails = getMarketDetailsForType(marketsState, 'PLANNING');
  const { intl, classes } = props;
  const items = [
    {
      text: intl.formatMessage({ id: 'sidebarNavDialogs' }),
      name: 'dialogs',
      link: '/dialogs',
      subItems: <SidebarDecisions/>
    },
    {
      text: intl.formatMessage({ id: 'sidebarNavNotifications' }),
      name: 'notifications',
      link: '/notifications',
    },
    {
      text: intl.formatMessage({ id: 'sidebarNavAbout' }),
      icon: <DescriptionOutlinedIcon/>,
      name: 'about',
      link: '/about',
    },
    {
      text: intl.formatMessage({ id: 'sidebarNewPlanning' }),
      name: 'plan',
      link: '/newplan',
    },
  ];

  function itemOnClick(item) {
    return () => {
      const { onClick, link } = item;
      if (onClick) {
        onClick();
      }
      if (link) {
        navigate(history, link);
      }
    };
  }


  function getListItems() {
    return items.map((item) => {
      const { name, text, subItems } = item;
      return (
        <div>
          <ListSubheader key={name} component="nav" onClick={itemOnClick(item)}>
            {text}
          </ListSubheader>
          {subItems}
        </div>
      );
    });
  }

  function getPlanningMarkets() {
    return marketDetails.map((market) => {
      const { name, id, text } = market;
      const item = { icon: <ChatIcon/>, text: name };
      return (
        <ListItem button key={id} component="nav" onClick={() => navigate(history, formMarketLink(id))}>
          {text}
        </ListItem>
      );
    });
  }

  return (
    <List component="nav">
      {getListItems()}
      {getPlanningMarkets()}
    </List>
  );
}

NavItems.propTypes = {
  intl: PropTypes.object.isRequired,
  classes: PropTypes.object.isRequired,
};

export default injectIntl(withStyles(styles)(NavItems));
