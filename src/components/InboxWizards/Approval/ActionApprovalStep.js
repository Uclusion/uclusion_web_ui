import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Tooltip, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { wizardStyles } from '../WizardStylesContext';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import JobApproveStep from './JobApproveStep';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getMarketInfo } from '../../../utils/userFunctions';
import { useHistory } from 'react-router';
import { FormattedMessage } from 'react-intl';
import WizardStepButtons from '../WizardStepButtons';
import _ from 'lodash';
import { formInvestibleAddCommentLink, navigate } from '../../../utils/marketIdPathFunctions';
import { JOB_COMMENT_WIZARD_TYPE } from '../../../constants/markets';

function ActionApprovalStep(props) {
  const {marketId, investibleId, formData, updateFormData, message } = props;
  const classes = wizardStyles();
  const history = useHistory();
  const [investiblesState] = useContext(InvestiblesContext);
  const inv = getInvestible(investiblesState, investibleId);
  const marketInfo = getMarketInfo(inv, marketId) || {};
  const { group_id: groupId } = marketInfo;
  const { isApprove } = formData;

  if (isApprove) {
    return <JobApproveStep {...props} groupId={groupId} marketInfo={marketInfo} message={message}/>;
  }

  const allowedTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
  const { useType } = formData;

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.introText}>
          What type of comment do you need?
        </Typography>
        <Typography className={classes.introSubText} variant="subtitle1">
          Any of these comments move the job out of approval and into the assistance stage.
        </Typography>
        <FormControl component="fieldset">
          <RadioGroup
            aria-labelledby="comment-type-choice"
            onChange={(event) => {
              const { value } = event.target;
              updateFormData({ useType: value });
            }}
            value={useType || ''}
            row
          >
            {allowedTypes.map((commentType) => {
              return (
                <Tooltip key={`tip${commentType}`}
                         title={<FormattedMessage id={`${commentType.toLowerCase()}Tip`} />}>
                  <FormControlLabel
                    id={`commentAddLabel${commentType}`}
                    key={commentType}
                    /* prevent clicking the label stealing focus */
                    onMouseDown={e => e.preventDefault()}
                    control={<Radio color="primary" />}
                    label={<FormattedMessage id={`${commentType.toLowerCase()}Present`} />}
                    labelPlacement="end"
                    value={commentType}
                  />
                </Tooltip>
              );
            })}
          </RadioGroup>
        </FormControl>
        <div className={classes.borderBottom} />
        <WizardStepButtons
          {...props}
          validForm={!_.isEmpty(useType)}
          nextLabel="WizardContinue"
          onNext={() => navigate(history,
            formInvestibleAddCommentLink(JOB_COMMENT_WIZARD_TYPE, investibleId, marketId, useType))}
          spinOnClick={false}
          showTerminate={false}
        />
      </div>
    </WizardStepContainer>
  );
}

ActionApprovalStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ActionApprovalStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ActionApprovalStep;