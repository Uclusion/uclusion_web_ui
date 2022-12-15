import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types'
import {
  Checkbox,
  IconButton,
  InputAdornment, List,
  ListItem, ListItemIcon,
  ListItemText,
  TextField,
  Typography
} from '@material-ui/core';
import _ from 'lodash'
import WizardStepContainer from '../WizardStepContainer'
import { WizardStylesContext } from '../WizardStylesContext'
import WizardStepButtons from '../WizardStepButtons'
import clsx from 'clsx';
import SearchIcon from '@material-ui/icons/Search';
import GravatarAndName from '../../Avatars/GravatarAndName';
import { addParticipants } from '../../../api/users';
import { addMarketPresences } from '../../../contexts/MarketPresencesContext/marketPresencesContextReducer';
import { MarketPresencesContext } from '../../../contexts/MarketPresencesContext/MarketPresencesContext';
import { usePlanFormStyles } from '../../AgilePlan';
import { OperationInProgressContext } from '../../../contexts/OperationInProgressContext/OperationInProgressContext';

function FromOtherWorkspacesStep (props) {
  const { participants, marketId } = props;
  const [,marketPresencesDispatch] = useContext(MarketPresencesContext);
  const [, setOperationRunning] = useContext(OperationInProgressContext);
  const wizardClasses = useContext(WizardStylesContext);
  const classes = usePlanFormStyles();
  const [filteredNames, setFilteredNames] = useState(participants);
  const [checked, setChecked] = useState([]);

  function getCheckToggle(id) {
    return () => {
      if (!checked.find((item) => item.user_id === id)) {
        const userDetail = participants.find((participant) => participant.user_id === id);
        if (userDetail) {
          setChecked(checked.concat([userDetail]));
        }
      } else {
        setChecked(checked.filter((item) => item.user_id !== id));
      }
    }
  }

  function renderParticipantEntry(presenceEntry) {
    const {
      user_id: id, name, email,
    } = presenceEntry
    const isChecked = !_.isEmpty(checked.find((item) => item.user_id === id));
    return (
      <ListItem
        key={id}
        onClick={getCheckToggle(id)}
        className={isChecked ? clsx(classes.unselected, classes.selected) : classes.unselected}
      >
        <ListItemIcon>
          <Checkbox
            checked={isChecked}
          />
        </ListItemIcon>
        <ListItemText>
          <GravatarAndName
            key={id}
            email={email}
            name={name}
            typographyVariant="caption"
            typographyClassName={classes.avatarName}
          />
        </ListItemText>
      </ListItem>
    )
  }

  function onNext () {
    const addUsers = checked.map((participant) => {
      return { external_id: participant.external_id, account_id: participant.account_id };
    });
    if (_.isEmpty(addUsers)) {
      setOperationRunning(false);
      return Promise.resolve(true);
    }
    return addParticipants(marketId, addUsers).then((result) => {
      setOperationRunning(false);
      marketPresencesDispatch(addMarketPresences(marketId, result));
    });
  }

  function onSearchChange(event) {
    const { value } = event.target;
    const searchValueLower = value.toLowerCase();
    const filteredEntries = participants.filter((entry) => {
      const { name } = entry;
      const nameLower = name.toLowerCase();
      let index = 0;
      for (const c of searchValueLower) {
        const foundIndex = _.indexOf(nameLower, c, index);
        if (foundIndex < 0) {
          return false;
        }
        index = foundIndex;
      }
      return true;
    })
    setFilteredNames(filteredEntries);
  }

  return (
    <WizardStepContainer
      {...props}
    >
      <div>
        <Typography className={wizardClasses.introText}>
          Who should be added from other workspaces?
        </Typography>
        <List
          dense
          className={clsx(classes.scrollableList, classes.sharedForm)}
        >
          <ListItem className={classes.searchContainer} key="search">
            {_.size(participants) > 10 && (
              <ListItemText>
                <TextField
                  className={classes.search}
                  placeholder="Search in your organization"
                  onChange={onSearchChange}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position={'end'}>
                        <IconButton>
                          <SearchIcon/>
                        </IconButton>
                      </InputAdornment>
                    )
                  }}
                />
              </ListItemText>
            )}
          </ListItem>
          <List
            dense
            id="addressBook"
            className={_.size(participants) > 4 ? classes.scrollContainer : undefined}
          >
            {filteredNames.map((entry) => renderParticipantEntry(entry))}
          </List>
        </List>
        <div className={wizardClasses.borderBottom}/>
        <WizardStepButtons {...props} showSkip={true} onNext={onNext} validForm={!_.isEmpty(checked)}/>
      </div>
    </WizardStepContainer>
  );
}

FromOtherWorkspacesStep.propTypes = {
  updateFormData: PropTypes.func,
  formData: PropTypes.object,
  onboarding: PropTypes.bool,
  onStartOnboarding: PropTypes.func,
};

FromOtherWorkspacesStep.defaultProps = {
  updateFormData: () => {},
  formData: {},
  onboarding: false,
  onStartOnboarding: () => {},
};

export default FromOtherWorkspacesStep;