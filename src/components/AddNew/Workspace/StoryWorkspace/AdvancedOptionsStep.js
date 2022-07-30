import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import { Typography, Card, TextField } from '@material-ui/core'
import { useIntl } from 'react-intl';
import StepButtons from '../../StepButtons';
import _ from 'lodash';
import { WizardStylesContext } from '../../WizardStylesContext';
import WizardStepContainer from '../../WizardStepContainer';
import Grid from '@material-ui/core/Grid';
import { usePlanFormStyles } from '../../../AgilePlan'
import { makeStyles } from '@material-ui/styles';
import { MarketsContext } from '../../../../contexts/MarketsContext/MarketsContext'
import { MarketStagesContext } from '../../../../contexts/MarketStagesContext/MarketStagesContext'
import { DiffContext } from '../../../../contexts/DiffContext/DiffContext'
import { InvestiblesContext } from '../../../../contexts/InvestibesContext/InvestiblesContext'
import { MarketPresencesContext } from '../../../../contexts/MarketPresencesContext/MarketPresencesContext'
import { CommentsContext } from '../../../../contexts/CommentsContext/CommentsContext'
import { doCreateStoryWorkspace } from './workspaceCreator'
import { formMarketLink } from '../../../../utils/marketIdPathFunctions'

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
        return ({ ...formData, link: formMarketLink(marketId, marketId) });
      })
  }

  function onFinish () {
    return createMarket({ ...formData });
  }

  function onTicketSubCodeChange(event) {
    const { value } = event.target;
    updateFormData({
      ticketSubCode: value
    });
  }

  function onSkip() {
    updateFormData({
      ticketSubCode: undefined
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
        <Typography>
          {intl.formatMessage({ id: "ticketSubCodeHelp" })}
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
                placeholder="Workspace short code"
              />
              {ticketSubCode && (<Typography>
                {intl.formatMessage({ id: "ticketSubCodeHelp1" }, {code: ticketSubCode})}
              </Typography>)}
            </Grid>
          </Grid>
        </Card>
        <div className={classes.borderBottom}/>
        <StepButtons
          {...props}
          validForm={!_.isEmpty(ticketSubCode)}
          showSkip
          onFinish={onFinish}
          onSkip={onSkip}
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