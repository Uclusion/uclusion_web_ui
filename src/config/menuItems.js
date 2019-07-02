import React from 'react';

import StarIcon from '@material-ui/icons/Star';
import InfoOutlinedIcon from '@material-ui/icons/InfoOutlined';
import QuestionAnswerIcon from '@material-ui/icons/QuestionAnswer';
import AccountBoxIcon from '@material-ui/icons/AccountBox';
import LockIcon from '@material-ui/icons/Lock';
import ListIcon from '@material-ui/icons/List';
import { AnonymousAuthorizer } from 'uclusion_authorizer_sdk';
import { formCurrentMarketLink } from '../utils/marketIdPathFunctions';
import { getMarketAuth } from '../components/utils';
import appConfig from './config';
import { ERROR, sendIntlMessage } from '../utils/userMessage';
import { getFlags } from '../utils/userFunctions'

const getMenuItems = (props) => {
  const {
//    locale,
//    updateTheme,
//    updateLocale,
    intl,
//    themeSource,
    isAuthMenu,
    handleSignOut,
    user,
    marketId,
  } = props;

  const permissions = getFlags(user);
  const {  isAdmin, isGuest} = permissions;
  const authInfo = getMarketAuth(marketId);
  const uclusionHelpType = isAdmin ? 'admins' : 'users';

/*  const themeItems = themes.map(t => ({
    value: undefined,
    visible: true,
    primaryText: intl.formatMessage({ id: t.id }),
    onClick: () => { updateTheme(t.id); },
    leftIcon: <StyleIcon style={{ color: t.color }} />,
  }));
*/
/*  const localeItems = allLocales.map(l => ({
    value: undefined,
    visible: true,
    primaryText: intl.formatMessage({ id: l.locale }),
    onClick: () => { updateLocale(l.locale); },
    leftIcon: <LanguageIcon />,
  }));
*/
  if (isAuthMenu) {
    return [
      {
        value: '/my_account',
        primaryText: intl.formatMessage({ id: 'my_account' }),
        leftIcon: <AccountBoxIcon />,
      },
    ];
  }


  return [
    {
      value: formCurrentMarketLink('investibles'),
      primaryText: intl.formatMessage({ id: 'investiblesMenu' }),
      leftIcon: <ListIcon />,
    },
    {
      divider: true,
    },
    {
      value: formCurrentMarketLink('about'),
      primaryText: intl.formatMessage({ id: 'about' }),
      leftIcon: <InfoOutlinedIcon />,
    },
  /*
  {
      primaryText: intl.formatMessage({ id: 'settings' }),
      primaryTogglesNestedList: true,
      leftIcon: <SettingsIcon />,
      nestedItems: [
        {
          primaryText: intl.formatMessage({ id: 'theme' }),
          secondaryText: intl.formatMessage({ id: themeSource.source }),
          primaryTogglesNestedList: true,
          leftIcon: <StyleIcon />,
          nestedItems: themeItems,
        },
        {
          primaryText: intl.formatMessage({ id: 'language' }),
          secondaryText: intl.formatMessage({ id: locale }),
          primaryTogglesNestedList: true,
          leftIcon: <LanguageIcon />,
          nestedItems: localeItems,
        },
      ],
    },
    */
    {
      primaryText: intl.formatMessage({ id: 'help' }),
      onClick: () => {
        const win = window.open(`https://www.uclusion.com/help_videos/${uclusionHelpType}/help.html`, '_blank');
        win.focus();
      },
      visible: !isGuest,
      leftIcon: <QuestionAnswerIcon />,
    },
    {
      primaryText: intl.formatMessage({ id: 'uclusionPlanningMarket' }),
      onClick: () => {
        const planningMarketId = '44147040-156d-4f60-b4c2-dcea7c2e9689';
        const planningMarketLocation = `https://stage.uclusion.com/${planningMarketId}/investibles`;
        if (authInfo && 'uclusion_user_id' in authInfo) {
          const win = window.open(planningMarketLocation, '_blank');
          win.focus();
        } else {
          const authorizer = new AnonymousAuthorizer({
            uclusionUrl: appConfig.api_configuration.baseURL,
          });
          const promise = authorizer.cognitoUserSignup(planningMarketId, user.name, user.email);
          promise.then((user) => {
            let location = planningMarketLocation;
            const encodedEmail = encodeURIComponent(user.email);
            if (!user.exists_in_cognito) {
              location += `?newLogin=true&email=${encodedEmail}`;
            } else {
              location += `?email=${encodedEmail}`;
            }
            const win = window.open(location, '_blank');
            win.focus();
          }).catch(() => {
            sendIntlMessage(ERROR, { id: 'planningMarketSignupFailed' });
          });
        }
      },
      visible: isAdmin,
      leftIcon: <StarIcon />,
    },
    {
      value: formCurrentMarketLink('Login'),
      onClick: handleSignOut,
      primaryText: intl.formatMessage({ id: 'sign_out' }),
      leftIcon: <LockIcon />,
    },
  ];
};

export default getMenuItems;
