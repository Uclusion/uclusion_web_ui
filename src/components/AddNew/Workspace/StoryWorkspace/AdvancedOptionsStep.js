import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography, Card, TextField } from '@material-ui/core'
import { useIntl } from 'react-intl';
import StepButtons from '../../StepButtons';
import _ from 'lodash';
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext';
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext';
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext';
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { CommentsContext } from '../../../../contexts/CommentsContext/CommentsContext';
import { doCreateStoryWorkspace } from './workspaceCreator';
import { WizardStylesContext } from '../../WizardStylesContext';
import WizardStepContainer from '../../WizardStepContainer';
import Grid from '@material-ui/core/Grid';
import { usePlanFormStyles } from '../../../AgilePlan'
import { makeStyles } from '@material-ui/styles';
import { MarketStagesContext } from '../../../../contexts/MarketStagesContext/MarketStagesContext';

export const useOptionsStyles = makeStyles(theme => {
  return {
    item: {
      marginTop: theme.spacing(2),
      marginBottom: theme.spacing(2),
      width: '100%',
      '& > *': {
        width: '100%',
      }
    },
    helper: {
      fontStyle: "italic",
      marginBottom: theme.spacing(2),
    },
    cardStyle: {
      padding: '1rem'
    }
  };
});

function AdvancedOptionsStep (props) {
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

  function onNext () {}

  function onSkip () {}

  function onFinish() {
    return createMarket({ ...formData });
  }

  function onTicketSubCodeChange(event) {
    const { value } = event.target;
    updateFormData({
      ticketSubCode: value
    });
  }

  const optionsClasses = useOptionsStyles();
  const otherClasses = usePlanFormStyles();

  const {
    ticketSubCode
  } = formData;

  return (
    <WizardStepContainer
      {...props}
      titleId="OnboardingWizardAdvancedOptionsStepLabel"
    >
      <div>
        <Typography variant="body1" className={optionsClasses.helper}>
          We've set up good defaults for you and any of these options can be changed later.
        </Typography>
        <Card className={optionsClasses.cardStyle}>
          <Grid container spacing={2} direction="column">
            <Grid
              item
              xs={12}
              className={optionsClasses.item}
            >
              <TextField
                id="name"
                className={otherClasses.input}
                value={ticketSubCode}
                onChange={onTicketSubCodeChange}
                placeholder="Ticket sub-code"
              />
              <Typography>
                {intl.formatMessage({ id: "ticketSubCodeHelp" })}
              </Typography>
              <br />
              <Typography>
                {intl.formatMessage({ id: "ticketSubCodeHelp1" })}
              </Typography>
            </Grid>
          </Grid>
        </Card>
        <div className={classes.borderBottom}/>
        <StepButtons
          {...props}
          validForm={!_.isEmpty(ticketSubCode)}
          showFinish
          spinOnClick
          onPrevious={onPrevious}
          onNext={onNext}
          finish={onFinish}
        />
      </div>
    </WizardStepContainer>
  );
}

AdvancedOptionsStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
};

AdvancedOptionsStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
};

export default AdvancedOptionsStep;