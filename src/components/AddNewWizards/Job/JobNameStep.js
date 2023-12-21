import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { addPlanningInvestible } from '../../../api/investibles';
import { formInvestibleLink } from '../../../utils/marketIdPathFunctions';
import { refreshInvestibles } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { moveCommentsFromIds } from './DecideWhereStep';
import { getCommentThreads } from '../../../contexts/CommentsContext/commentsContextHelper';
import { CommentsContext } from '../../../contexts/CommentsContext/CommentsContext';
import { NotificationsContext } from '../../../contexts/NotificationsContext/NotificationsContext';
import NameField, { clearNameStoredState, getNameStoredState } from '../../TextFields/NameField';

function JobNameStep(props) {
  const { marketId, groupId, updateFormData, onFinish, formData, fromCommentIds, marketComments } = props;
  const [, commentsDispatch] = useContext(CommentsContext);
  const [messagesState, messagesDispatch] = useContext(NotificationsContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const classes = useContext(WizardStylesContext);
  const [hasValue, setHasValue] = useState(false);
  const { description, uploadedFiles, jobStage } = formData;
  const nameId = `jobNameEdit${groupId}`;

  function createJob() {
    const name = getNameStoredState(nameId);
    const addInfo = {
      name,
      description,
      groupId,
      marketId,
      uploadedFiles
    }
    if (jobStage === 'READY') {
      addInfo.openForInvestment = true;
    }
    return addPlanningInvestible(addInfo)
      .then((inv) => {
        clearNameStoredState(nameId);
        refreshInvestibles(investiblesDispatch, () => {}, [inv]);
        const { id: investibleId } = inv.investible;
        let link = formInvestibleLink(marketId, investibleId);
        // update the form data with the saved investible
        updateFormData({
          investibleId,
          link,
        });
        if (fromCommentIds) {
          const roots = (fromCommentIds || []).map((fromCommentId) =>
            marketComments.find((comment) => comment.id === fromCommentId) || {id: 'notFound'});
          const comments = getCommentThreads(roots, marketComments);
          return moveCommentsFromIds(inv, comments, fromCommentIds, marketId, groupId, messagesState, updateFormData,
            commentsDispatch, messagesDispatch)
        }
        if (jobStage === 'IMMEDIATE') {
          return { link };
        }
        onFinish({ link });
      })
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
      <Typography className={classes.introText} style={{paddingBottom: '1rem'}}>
        How would you name this job?
      </Typography>
      <NameField id={nameId} setHasValue={setHasValue} />
      <div className={classes.borderBottom} />
      <WizardStepButtons
        {...props}
        validForm={hasValue}
        nextLabel="jobCreate"
        onNext={createJob}
        onNextDoAdvance={jobStage === 'IMMEDIATE'}
        isFinal={jobStage !== 'IMMEDIATE'}
      />
    </WizardStepContainer>
  );
}

JobNameStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

JobNameStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default JobNameStep;