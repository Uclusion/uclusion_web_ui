import React from 'react';
import PropTypes from 'prop-types';
import { WizardStylesProvider } from '../WizardStylesContext';
import FormdataWizard from 'react-formdata-wizard';
import AddCommentStep from './AddCommentStep';
import { QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import AddOptionStep from './AddOptionStep';
import ConfigureCommentStep from '../ConfigureCommentStep';

function JobCommentWizard(props) {
  const { investibleId, marketId, commentType } = props;

  return (
    <WizardStylesProvider>
      <FormdataWizard name={`job_comment_wizard${investibleId}`} useLocalStorage={false}>
        <AddCommentStep investibleId={investibleId} marketId={marketId} useType={commentType} />
        {commentType === QUESTION_TYPE && (
          <AddOptionStep investibleId={investibleId} marketId={marketId} />
        )}
        {[QUESTION_TYPE, SUGGEST_CHANGE_TYPE].includes(commentType) && (
          <ConfigureCommentStep useType={commentType} />
        )}
      </FormdataWizard>
    </WizardStylesProvider>
  );
}

JobCommentWizard.propTypes = {
  investibleId: PropTypes.string.isRequired
};
export default JobCommentWizard;

