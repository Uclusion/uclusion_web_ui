import React from 'react'
import PropTypes from 'prop-types'
import GroupNameStep from './GroupNameStep'
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import GroupMembersStep from './GroupMemberStep'
import { useHistory } from 'react-router';
import { navigate } from '../../../utils/marketIdPathFunctions';
import { usePresences } from '../../../contexts/MarketPresencesContext/marketPresencesHelper';
import _ from 'lodash';

function GroupWizard(props) {
  const {marketId } = props;
  const history = useHistory();
  const presences = usePresences(marketId);
  const isSingleWorkspaceMember = _.size(presences) === 1;

  const onFinish = (formData) => {
    const {link} = formData;
    navigate(history, link);
  }

  return (
    <WizardStylesProvider>
      <FormdataWizard name="group_wizard" onFinish={onFinish} useLocalStorage={false}>
        <GroupNameStep marketId={marketId} isSingleWorkspaceMember={isSingleWorkspaceMember} />
        {!isSingleWorkspaceMember && (
          <GroupMembersStep marketId={marketId}/>
        )}
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

GroupWizard.propTypes = {
  marketId: PropTypes.string.isRequired,
};


export default GroupWizard;

