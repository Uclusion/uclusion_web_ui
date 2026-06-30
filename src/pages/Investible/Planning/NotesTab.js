import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import _ from 'lodash';
import { Typography, useTheme } from '@material-ui/core';
import CommentBox from '../../../containers/CommentBox/CommentBox';
import CondensedTodos from './CondensedTodos';
import { groupNotesByDay } from './notesGrouping';
import { getBrowserTz, formatDayLabel } from '../../../utils/timezoneUtils';
import { SearchResultsContext } from '../../../contexts/SearchResultsContext/SearchResultsContext';

function NotesTab(props) {
  const {
    notes,
    investibleComments,
    replies,
    marketId,
    marketInfo,
    investible,
    fullStage,
    formerStageId,
    assigned,
    isRequiresInput,
    isInBlocking
  } = props;
  const theme = useTheme();
  const [searchResults] = useContext(SearchResultsContext);
  const { results = [], parentResults = [], search } = searchResults || {};
  const viewerTz = getBrowserTz();
  const tasks = (investibleComments || []).filter((comment) => comment.comment_type === 'TODO');
  // During a search, only resolved tasks that themselves match get a header; matching notes still render
  // their task header via the note's sub-group, so context isn't lost (T-all-2235 / Q-all-176).
  const resolvedTaskMatchIds = _.isEmpty(search) ? undefined
    : new Set(tasks.filter((task) => results.find((item) => item.id === task.id)
        || parentResults.find((id) => id === task.id)).map((task) => task.id));
  const days = groupNotesByDay(notes, tasks, viewerTz, resolvedTaskMatchIds);

  if (_.isEmpty(days)) {
    return null;
  }

  const commentBoxCommonProps = {
    marketId,
    marketInfo,
    investible,
    investibleComments,
    fullStage,
    formerStageId,
    assigned,
    isRequiresInput,
    isInBlocking,
    usePadding: false,
    preserveOrder: true,
    inNotesTab: true
  };

  return (
    <div>
      {days.map((day) => (
        <div key={day.dayKey} style={{ marginBottom: '2rem' }}>
          <Typography
            variant="h6"
            style={{
              marginTop: '1rem',
              marginBottom: '0.5rem',
              paddingBottom: '0.25rem',
              borderBottom: `1px solid ${theme.palette.divider}`
            }}
          >
            {formatDayLabel(day.dayKey, viewerTz)}
          </Typography>
          {!_.isEmpty(day.jobLevelNotes) && (
            <div style={{ marginBottom: '1rem' }}>
              <CommentBox
                {...commentBoxCommonProps}
                comments={day.jobLevelNotes.concat(replies || [])}
              />
            </div>
          )}

          {day.subGroups.map((sg) => (
            <div key={`${day.dayKey}-${sg.task.id}`} style={{ marginBottom: '1.5rem' }}>
              <CondensedTodos
                comments={[sg.task]}
                investibleComments={investibleComments}
                marketInfo={marketInfo}
                marketId={marketId}
                hideTabs
                hideTitle
                isDefaultOpen
                showChecked={false}
                usePadding={false}
                maxWidth="98%"
                inNotesTab
              />
              {!_.isEmpty(sg.notes) && (
                <div style={{ marginLeft: '1rem', marginTop: '0.5rem' }}>
                  <CommentBox
                    {...commentBoxCommonProps}
                    comments={sg.notes.concat(replies || [])}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

NotesTab.propTypes = {
  notes: PropTypes.array.isRequired,
  investibleComments: PropTypes.array.isRequired,
  replies: PropTypes.array,
  marketId: PropTypes.string.isRequired,
  marketInfo: PropTypes.object,
  investible: PropTypes.object,
  fullStage: PropTypes.object,
  formerStageId: PropTypes.string,
  assigned: PropTypes.array,
  isRequiresInput: PropTypes.bool,
  isInBlocking: PropTypes.bool
};

export default NotesTab;
