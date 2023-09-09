import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { FormControl, FormControlLabel, Radio, RadioGroup, Tooltip, Typography } from '@material-ui/core';
import WizardStepContainer from '../WizardStepContainer';
import { WizardStylesContext } from '../WizardStylesContext';
import WizardStepButtons from '../WizardStepButtons';
import { ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE } from '../../../constants/comments';
import { FormattedMessage } from 'react-intl';
import { InvestiblesContext } from '../../../contexts/InvestibesContext/InvestiblesContext';
import { getInvestible } from '../../../contexts/InvestibesContext/investiblesContextHelper';
import { getFullStage } from '../../../contexts/MarketStagesContext/marketStagesContextHelper';
import { MarketStagesContext } from '../../../contexts/MarketStagesContext/MarketStagesContext';
import _ from 'lodash';

function ChooseCommentTypeStep (props) {
  const { investibleId, updateFormData, formData } = props;
  const classes = useContext(WizardStylesContext);
  const [investibleState] = useContext(InvestiblesContext);
  const [marketStagesState] = useContext(MarketStagesContext);
  const inv = getInvestible(investibleState, investibleId);
  // Only one market possible for decision investible
  const marketInfo = inv?.market_infos[0];
  const { stage, market_id: marketId, group_id: groupId } = marketInfo || {};
  const fullStage = getFullStage(marketStagesState, marketId, stage) || {};
  const allowedTypes = [ISSUE_TYPE, QUESTION_TYPE, SUGGEST_CHANGE_TYPE];
  const { useType } = formData;

  return (
    <WizardStepContainer
      {...props}
    >
      <Typography className={classes.introText}>
        What type of comment do you need?
      </Typography>
      {fullStage.allows_investment && (
        <Typography className={classes.introSubText} variant="subtitle1">
          Opening a blocking issue will halt voting on this option.
        </Typography>
      )}
      <FormControl component="fieldset">
        <RadioGroup
          aria-labelledby="comment-type-choice"
          onChange={(event) => {
            const { value } = event.target;
            updateFormData({ useType: value, marketId, groupId });
          }}
          value={useType || ''}
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
        isFinal={false}
        spinOnClick={false}
        showTerminate={false}
      />
    </WizardStepContainer>
  );
}

ChooseCommentTypeStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object
};

ChooseCommentTypeStep.defaultProps = {
  updateFormData: () => {},
  formData: {}
};

export default ChooseCommentTypeStep;