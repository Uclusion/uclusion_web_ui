import React from 'react';
import { useIntl } from 'react-intl';
import { getDialogTypeIcon } from '../../components/Dialogs/dialogIconFunctions';
import { DECISION_TYPE, INITIATIVE_TYPE, PLANNING_TYPE } from '../../constants/markets';
import { Typography } from '@material-ui/core';

function HomeCheatSheat() {
  const intl = useIntl();

  return (
    <div>
      <Typography variant="h3">
        {intl.formatMessage({ id: 'homeCheatWelcome' })}
      </Typography>
      <Typography component="div">
        Uclusion offers several ways to collaborate with your team.
        <ul>
          <li>Agile Plans
            <ul>
              <li>
                These implement Unproject Management and let you control your daily work.
                To create one go to your sidebar and click the {getDialogTypeIcon(PLANNING_TYPE)} icon.
              </li>
            </ul>
          </li>
          <li>Dialogs
            <ul>
              <li>Dialogs let you reach a decision with involved stakeholders, and facilitate structured
                conversation around the decision.
                They can be started by clicking the {getDialogTypeIcon(DECISION_TYPE)} icon in the sidebar.
              </li>
            </ul>
          </li>
          <li>Initiatives
            <ul>
              <li>
                If you have an idea and want to guage support across your organization, initiatives are the ideal
                choice.
                They make sure everyone weighs in, and display support at a glance.
                Initiatives can be sent by clicking the {getDialogTypeIcon(INITIATIVE_TYPE)} icon in the sidebar.
              </li>
            </ul>
          </li>
        </ul>
      </Typography>
    </div>
  );
}

export default HomeCheatSheat;