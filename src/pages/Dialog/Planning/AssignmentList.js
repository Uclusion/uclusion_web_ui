import React, { useState } from 'react'
import PropTypes from 'prop-types'
import _ from 'lodash'
import {
  IconButton,
  List,
  ListItem, ListItemIcon,
  ListItemText,
  ListSubheader,
  makeStyles,
  TextField
} from '@material-ui/core'
import { useIntl } from 'react-intl'
import Typography from '@material-ui/core/Typography'
import Autocomplete from '@material-ui/lab/Autocomplete'
import AddIcon from '@material-ui/icons/Add'
import { ACTION_BUTTON_COLOR } from '../../../components/Buttons/ButtonConstants'
import { Clear } from '@material-ui/icons'

const useStyles = makeStyles(() => ({
  name: {
    width: '50%',
    padding: 0,
    margin: 0
  },
  scrollContainerHeight: {
    height: '230px'
  }
}));

function AssignmentList(props) {
  const {
    fullMarketPresences,
    onChange,
    previouslyAssigned,
    listHeader,
    emptyListHeader,
    requiresInput
  } = props;
  const [clearMeHack, setClearMeHack] = useState('a');
  const classes = useStyles();
  const intl = useIntl();
  const marketPresences = fullMarketPresences.filter((presence) => !presence.market_banned);

  function getDefaultChecked() {
    if (!_.isEmpty(previouslyAssigned)) {
      return previouslyAssigned.reduce((acc, id) => ({
        ...acc,
        [id]: true,
      }), {});
    }
    return {};
  }

  function getSortedPresenceWithAssignable() {
    return _.sortBy(marketPresences, 'name');
  }

  const participants = getSortedPresenceWithAssignable();
  const [selectedPresence, setSelectedPresence] = useState(undefined);
  const [submitted, setSubmitted] = useState(getDefaultChecked());


  function changeAssignments(newChecked) {
    if (submitted !== newChecked) {
      setSubmitted(newChecked);
      const checkedIds = Object.keys(newChecked).filter((key) => newChecked[key]);
      onChange(checkedIds);
    }
  }

  function removeAssignment(id) {
    const newChecked = {
      ...submitted,
      [id]: false,
    };
    changeAssignments(newChecked);
  }

  function addAssignment() {
    const id = selectedPresence.id;
    const newChecked = {
      ...submitted,
      [id]: true,
    };
    changeAssignments(newChecked);
    setClearMeHack(clearMeHack+clearMeHack);
  }

  function renderAssignedEntry(presenceEntry) {
    const { name, id } = presenceEntry;
    if (!submitted[id]) {
      return React.Fragment;
    }
    return (
      <ListItem key={`assigned${id}`} style={{padding: 0, margin: 0}}>
        <ListItemIcon onClick={() => removeAssignment(id)}>
          <IconButton style={{padding: 0, margin: 0}}>
            <Clear />
          </IconButton>
        </ListItemIcon>
        <ListItemText
          className={classes.name}
        >
          {name}
        </ListItemText>
      </ListItem>
    );
  }
  const checked = participants.filter((presence) => submitted[presence.id]);
  const unChecked = participants.filter((presence) => !submitted[presence.id]);
  const defaultProps = {
    options: unChecked,
    getOptionLabel: (option) => option.name,
  };

  return (
    <div>
      <div style={{display: 'flex'}}>
        <Autocomplete
          {...defaultProps}
          key={clearMeHack}
          id="addLabel"
          renderInput={(params) => <TextField {...params}
                                              label={intl.formatMessage({ id: 'searchAssignments' })}
                                              margin="dense"
                                              variant="outlined" />}
          style={{ width: 300, maxHeight: '1rem' }}
          onChange={(event, value) => setSelectedPresence(value)}
        />
        <IconButton
          onClick={addAssignment}
        >
          <AddIcon htmlColor={ACTION_BUTTON_COLOR}/>
        </IconButton>
      </div>
      {requiresInput && (
        <Typography color='error'>
          {intl.formatMessage({ id: 'requiresInputListHeader' })}
        </Typography>
      )}
      {!_.isEmpty(checked) && (
        <List
          dense
          id="addressBook"
          style={{padding: 0, margin: 0}}
        >
          <ListSubheader style={{padding: 0, margin: 0}}>
            {intl.formatMessage({ id: listHeader })}
          </ListSubheader>
          {participants.map((entry) => renderAssignedEntry(entry))}
        </List>
      )}
      {_.isEmpty(checked) && emptyListHeader && (
        <div style={{paddingTop: '1rem'}}>
          {intl.formatMessage({ id: emptyListHeader })}
        </div>
      )}
    </div>
  );
}

AssignmentList.propTypes = {
  fullMarketPresences: PropTypes.arrayOf(PropTypes.object),
  listHeader: PropTypes.string,
  emptyListHeader: PropTypes.string,
  previouslyAssigned: PropTypes.arrayOf(PropTypes.string),
  cannotBeAssigned: PropTypes.arrayOf(PropTypes.string),
  onChange: PropTypes.func,
  requiresInput: PropTypes.bool
};

AssignmentList.defaultProps = {
  listHeader: 'assignmentListHeader',
  emptyListHeader: undefined,
  onChange: () => {
  },
  previouslyAssigned: [],
  cannotBeAssigned: [],
  requiresInput: false
};

export default AssignmentList;
