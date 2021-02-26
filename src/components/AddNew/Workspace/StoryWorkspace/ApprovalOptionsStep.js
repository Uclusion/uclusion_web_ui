import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography, Card } from '@material-ui/core'
import { useIntl } from 'react-intl';
import StepButtons from '../../StepButtons';
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext';
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext';
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { CommentsContext } from '../../../../contexts/CommentsContext/CommentsContext';
import { doCreateStoryWorkspace } from './workspaceCreator';
import { WizardStylesContext } from '../../WizardStylesContext';
import WizardStepContainer from '../../WizardStepContainer';
import Grid from '@material-ui/core/Grid';
import { VoteExpiration, Votes } from '../../../AgilePlan'
import { MarketStagesContext } from '../../../../contexts/MarketStagesContext/MarketStagesContext';
import { useOptionsStyles } from './AdvancedOptionsStep'

function ApprovalOptionsStep (props) {
  const { updateFormData, formData } = props;
  const intl = useIntl();
  const classes = useContext(WizardStylesContext);
  const [, marketsDispatch] = useContext(MarketsContext);
  const [, marketStagesDispatch] = useContext(MarketStagesContext);
  const [, diffDispatch] = useContext(DiffContext);
  const [, investiblesDispatch] = useContext(InvestiblesContext);
  const [, presenceDispatch] = useContext(MarketPresencesContext);
  const [commentsState, commentsDispatch] = useContext(CommentsContext);

  function createMarket (formData) {
    const dispatchers = {
      marketStagesDispatch,
      diffDispatch,
      investiblesDispatch,
      marketsDispatch,
      presenceDispatch,
      commentsDispatch,
      commentsState,
    };
    return doCreateStoryWorkspace(dispatchers, formData, updateFormData, intl)
      .then((marketId) => {
        return ({ ...formData, marketId });
      });
  }

  function onPrevious () {}

  function onFinish() {
    return createMarket({ ...formData });
  }

  function handleChange (name) {
    return (event) => {
      const { value } = event.target;
      const parsed = parseInt(value, 10);
      updateFormData({
        [name]: parsed,
      });
    };
  }

  const optionsClasses = useOptionsStyles();

  const {
    investmentExpiration,
    votesRequired,
  } = formData;

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={classes.title} variant="h5">Approval Configuration</Typography>
        <Typography variant="body1" className={optionsClasses.helper}>
          Approvals are part of Uclusion built-in workflows. You can control how many approvals a story requires and
          how long they last.
        </Typography>
        <Card className={optionsClasses.cardStyle}>
          <Grid container spacing={2} direction="column">
            <Grid
              item
              xs={12}
              className={optionsClasses.item}
            >
              <VoteExpiration
                onChange={handleChange('investmentExpiration')}
                value={investmentExpiration}
              />
            </Grid>
            <Grid
              item
              xs={12}
              className={optionsClasses.item}
            >
              <Votes onChange={handleChange('votesRequired')} value={votesRequired || 0}/>
            </Grid>
          </Grid>
        </Card>
        <div className={classes.borderBottom}/>
        <StepButtons
          {...props}
          showSkip
          spinOnClick
          onPrevious={onPrevious}
          onFinish={onFinish}
        />
      </div>
    </WizardStepContainer>
  );
}

ApprovalOptionsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

ApprovalOptionsStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default ApprovalOptionsStep;