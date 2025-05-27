import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { formMarketAddInvestibleLink, navigate } from '../../../utils/marketIdPathFunctions';
import { useHistory } from 'react-router';
import _ from 'lodash';
import ChooseJob from '../../Search/ChooseJob';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';

function FindJobStep(props) {
  const { marketId, groupId, updateFormData, formData, startOver, moveFromComments, roots, isConvert, useType } = props;
  const history = useHistory();
  const classes = useContext(WizardStylesContext);
  const [investiblesState] = useContext(InvestiblesContext);
  const { investibleId } = formData;
  const currentInvestibleId = roots[0].investible_id;

  function onTerminate() {
    let checkedString;
    roots.forEach((comment) => {
      if (checkedString) {
        checkedString += `&fromCommentId=${comment.id}`;
      } else {
        checkedString = `&fromCommentId=${comment.id}`;
      }
    });
    startOver();
    navigate(history, `${formMarketAddInvestibleLink(marketId, groupId)}${checkedString}`);
  }

  function onNext() {
    if (moveFromComments) {
      const inv = getInvestible(investiblesState, investibleId);
      return moveFromComments(inv, formData, updateFormData, true).then(({link}) => navigate(history, link));
    }
  }

  return (
    <WizardStepContainer
      {...props}
      isLarge
    >
        <Typography className={classes.introText} variant="h6">
          Move to which job?
        </Typography>
        {useType && (
          <Typography className={classes.introSubText} variant="subtitle1">
            You are converting to a {useType}.
          </Typography>
        )}
        <ChooseJob
          marketId={marketId}
          groupId={groupId}
          formData={formData}
          excluded={currentInvestibleId && !isConvert ? [currentInvestibleId] : undefined}
          onChange={(id) => {
            updateFormData({ investibleId: id })
          }}
        />
        <div className={classes.borderBottom}/>
        <WizardStepButtons
          {...props}
          validForm={!_.isEmpty(investibleId)}
          showTerminate={true}
          onNext={onNext}
          onTerminate={onTerminate}
          terminateLabel="JobWizardStartOver"
          nextLabel="storyFromComment"
        />
    </WizardStepContainer>
  )
}

FindJobStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
}

FindJobStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
}

export default FindJobStep