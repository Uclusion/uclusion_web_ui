import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { makeStyles } from '@material-ui/core';
import Screen from '../../containers/Screen/Screen';
import { MarketsContext } from '../../contexts/MarketsContext/MarketsContext';
import {
  getMarketDetailsForType,
  getNotHiddenMarketDetailsForUser,
} from '../../contexts/MarketsContext/marketsContextHelper';
import PlanningDialogs from './PlanningDialogs';
import SubSection from '../../containers/SubSection/SubSection';
import DecisionDialogs from './DecisionDialogs';
import DecisionAdd from './DecisionAdd';
import DecisionAddActionButton from './DecisionAddActionButton';
import PlanningAdd from './PlanningAdd';
import PlanningAddActionButton from './PlanningAddActionButton';
import InitiativeAddActionButton from './InitiativeAddActionButton';
import { INITIATIVE_TYPE, DECISION_TYPE, PLANNING_TYPE } from '../../constants/markets';
import { SECTION_TYPE_PRIMARY, SECTION_TYPE_SECONDARY } from '../../constants/global';
import InitiativeAdd from './InitiativeAdd';
import InitiativeDialogs from './InitiativeDialogs';
import ViewArchiveActionButton from './ViewArchivesActionButton';
import { useIntl } from 'react-intl';
import { MarketPresencesContext } from '../../contexts/MarketPresencesContext/MarketPresencesContext';
import SidebarMenuButton from '../../components/Buttons/SidebarMenuButton';
import ArticlePaper from '../../components/ArticlePaper';
import DiscussionCard from '../../components/Cards/DiscussionCard';
import OptionCard from '../../components/Cards/OptionCard';
import VoteCard from '../../components/Cards/VoteCard';


const useStyles = makeStyles(() => ({
  breadCrumbImage: {
    height: 40,
  },
  offset_6: {
    marginTop: '30px',
  },
  offset_30: {
    marginTop: '30px',
  },
  offset_56: {
    marginTop: '56px',
  },
  offset_71: {
    marginTop: '71px',
  },
  cardGridLayout: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gridGap: '6px',
    marginTop: '6px',
  },
  cardGridLayout_one: {
    display: 'grid',
    gridTemplateColumns: '1fr',
    gridGap: '6px',
    marginTop: '6px',
  },
}));

const breadCrumbs = [
  {
    title: 'Breadcrumb'
  },
  {
    title: 'Longer Breadcrumb'
  },
];

function Home(props) {
  const { hidden } = props;
  const classes = useStyles();
  const intl = useIntl();
  const [marketsState] = useContext(MarketsContext);
  const [marketPresencesState] = useContext(MarketPresencesContext);
  const myNotHiddenMarketsState = getNotHiddenMarketDetailsForUser(marketsState,
    marketPresencesState);
  const planningDetails = getMarketDetailsForType(myNotHiddenMarketsState, PLANNING_TYPE);
  const decisionDetails = getMarketDetailsForType(myNotHiddenMarketsState, DECISION_TYPE);
  const initiativeDetails = getMarketDetailsForType(myNotHiddenMarketsState, INITIATIVE_TYPE);
  const [planningAddMode, setPlanningAddMode] = useState(false);
  const [decisionAddMode, setDecisionAddMode] = useState(false);
  const [initiativeAddMode, setInitiativeAddMode] = useState(false);

  const SIDEBAR_ACTIONS = [
    {
      label: intl.formatMessage({id: 'edit'}),
      icon: 'images/Uclusion_Sidebar_Edit.svg',
      onClick: () => {},
    },
    {
      label: intl.formatMessage({id: 'new'}),
      icon: 'images/Uclusion_Sidebar_New.svg',
      onClick: () => {},
    },
    {
      label: intl.formatMessage({id: 'information'}),
      icon: 'images/Uclusion_Sidebar_Info.svg',
      onClick: () => {},
    },
    {
      label: intl.formatMessage({id: 'message'}),
      icon: 'images/Uclusion_Sidebar_Message.svg',
      onClick: () => {},
    },
  ];

  const VOTE_INFO = [
    {
      title: 'Big Bird is Awesome',
      voteNum: 16,
      chart: 'images/Uclusion_Vote_Chart1.svg',
    },
    {
      title: 'Potentially needing some flexible font sizes? Align-center in the component works too!',
      voteNum: 2,
      chart: 'images/Uclusion_Vote_Chart2.svg',
    },
    {
      title: 'Three Voting Options Shown?',
      voteNum: 16,
      chart: 'images/Uclusion_Vote_Chart1.svg',
      warning: 'Option Warning',
      isWarningActive: false,
    },
    {
      title: 'Four Things to vote on this is incredible. Can’t Believe it',
      voteNum: 2,
      chart: 'images/Uclusion_Vote_Chart2.svg',
    },
  ];

  const OPTIONS_INFO = [
    {
      title: 'Proposed option by Ernie',
      latestDate: '12/9/2019',
    },
    {
      title: 'Something someone once told me, well here it is',
      latestDate: '12/9/2019',
    },
  ];

  const DISCUSSIONS = [
    {
      status: true,
      warning: 'Bad Idea',
      content: 'Sit do excepteur consectetur commodo. Exercitation commodo quis officia sit amet cupidatat aliqua exercitation labore duis. Elit velit dolore aliquip commodo labore dolore laborum laboris. Sit do excepteur consectetur commodo. Exercitation commodo quis officia sit amet cupidatat aliqua exercitation labore duis. Elit velit dolore aliquip commodo labore dolore laborum laboris.',
    },
    {
      status: true,
      warning: 'Bad Idea',
      content: 'Sit do excepteur consectetur commodo. Exercitation commodo quis officia sit amet cupidatat aliqua exercitation labore duis. Elit velit dolore aliquip commodo labore dolore laborum laboris. Sit do excepteur consectetur commodo. Exercitation commodo quis officia sit amet cupidatat aliqua exercitation labore duis. Elit velit dolore aliquip commodo labore dolore laborum laboris.',
    },
  ]

  function toggleInitiativeAddMode() {
    setInitiativeAddMode(!initiativeAddMode);
  }

  function toggleDecisionAddMode() {
    setDecisionAddMode(!decisionAddMode);
  }

  function togglePlanningAddMode() {
    setPlanningAddMode(!planningAddMode);
  }

  const sidebarActions = [];
    SIDEBAR_ACTIONS.forEach((action, index) => {
      sidebarActions.push(<SidebarMenuButton key={index} icon={action.icon} label={action.label} onClick={action.onClick} />);
    });

  function getContents() {
    if (planningAddMode) {
      return (
        <PlanningAdd
          onCancel={togglePlanningAddMode}
          onSave={togglePlanningAddMode}
        />
      );
    }
    if (decisionAddMode) {
      return (
        <DecisionAdd
          onCancel={toggleDecisionAddMode}
          onSave={toggleDecisionAddMode}
        />
      );
    }

    if (initiativeAddMode) {
      return (
        <InitiativeAdd
          onCancel={toggleInitiativeAddMode}
          onSave={toggleInitiativeAddMode}
        />
      );
    }
    return (
      <>
        <div className={classes.offset_30}>
          <SubSection type={SECTION_TYPE_PRIMARY} title='Background Information'>
            <ArticlePaper />
          </SubSection>
        </div>
        <div className={classes.offset_30}>
          <SubSection type={SECTION_TYPE_SECONDARY} title='Currently Voting'>
            <div className={classes.cardGridLayout}>
              {VOTE_INFO.map((item, index) => {
                return (
                  <VoteCard 
                    key={index}
                    title={item.title} 
                    warning={item.warning} i
                    isWarningActive={item.isWarningActive} 
                    voteNum={item.voteNum} c
                    chart={item.chart} />
                  );
              })}
            </div>
          </SubSection>
        </div>
        <div className={classes.offset_56}>
          <SubSection type={SECTION_TYPE_SECONDARY} title='Proposed Options'>
              <div className={classes.cardGridLayout}>
                {OPTIONS_INFO.map((item, index) => {
                  return (
                    <OptionCard 
                      key={index}
                      title={item.title} 
                      latestDate={item.latestDate} />
                    );
                })}
              </div>
            </SubSection>
        </div>
        <div className={classes.offset_71}>
          <SubSection type={SECTION_TYPE_SECONDARY} title='Discussion'>
            <div className={classes.cardGridLayout_one}>
              {DISCUSSIONS.map((item, index) => {
                return (
                  <DiscussionCard 
                    key={index}
                    status={item.status} 
                    warning={item.warning} 
                    content={item.content}/>
                  );
              })}
            </div>
          </SubSection>
        </div>
      </>
    );
  }

  return (
    <Screen
      title="Shockingly long breadcrumb to show information"
      tabTitle={intl.formatMessage({ id: 'homeBreadCrumb' })}
      hidden={hidden}
      sidebarActions={sidebarActions}
      breadCrumbs={breadCrumbs}
    >
      {getContents()}
    </Screen>
  );
}

Home.propTypes = {
  hidden: PropTypes.bool.isRequired,
};

export default Home;
