import _ from 'lodash';
import { getLocalDayKey } from '../../../utils/timezoneUtils';

// Group notes (and any resolved-on-that-day tasks) by calendar day for the
// Notes tab. The returned shape is:
//   [{
//     dayKey,          // YYYY-MM-DD, suitable for stable sorting & React keys
//     timestamp,       // ISO of the latest activity in this day (used by callers if needed)
//     jobLevelNotes,   // notes with no associated_comment_id, ascending by updated_at
//     subGroups: [{
//       task,              // the TODO_TYPE comment
//       notes,             // notes assoc'd to this task whose updated-day === dayKey, ascending
//       isResolvedHere,    // true if task is resolved and its resolve-day === dayKey
//       timestamp          // ISO of latest note in this day, or task.updated_at if resolved-only
//     }]
//   }]
//
// Day groups are sorted descending (oldest at bottom, today at top)
// Sub-groups within a day are sorted descending by their `timestamp` 
// ("whichever task has the later notes displays later"). Job-level notes for the
// day render above all sub-groups, with no sub-header
//
// Day membership uses the comment's `tz` field (creator's IANA zone) when present,
// falling back to viewerTz, per Q-all-59. The note's bucketing key is
// floor(updated_at) per Q-all-54, and a resolved task's day is
// floor(task.updated_at) per Q-all-62 (resolved comments cannot be edited so
// updated_at reflects the resolve event).
// resolvedTaskMatchIds (optional Set): when supplied (an active search), only resolved tasks whose id is in
// the set get a header injected; pass undefined to inject all resolved tasks as before (T-all-2235).
export function groupNotesByDay(notes, tasks, viewerTz, resolvedTaskMatchIds) {
  const safeNotes = notes || [];
  const safeTasks = tasks || [];

  const byDay = {};

  function ensureDay(dayKey) {
    if (!byDay[dayKey]) {
      byDay[dayKey] = {
        dayKey,
        jobLevelNotes: [],
        bySubTaskId: {}
      };
    }
    return byDay[dayKey];
  }

  function ensureSubGroup(dayBucket, task) {
    if (!dayBucket.bySubTaskId[task.id]) {
      dayBucket.bySubTaskId[task.id] = {
        task,
        notes: [],
        isResolvedHere: false
      };
    }
    return dayBucket.bySubTaskId[task.id];
  }

  const tasksById = _.keyBy(safeTasks, 'id');

  safeNotes.forEach((note) => {
    if (!note?.updated_at) {
      return;
    }
    const dayKey = getLocalDayKey(note.updated_at, note.tz || viewerTz);
    if (!dayKey) {
      return;
    }
    const day = ensureDay(dayKey);
    const assocId = note.associated_comment_id;
    const assocTask = assocId ? tasksById[assocId] : undefined;
    if (assocTask) {
      ensureSubGroup(day, assocTask).notes.push(note);
    } else {
      day.jobLevelNotes.push(note);
    }
  });

  safeTasks.forEach((task) => {
    if (!task?.resolved || !task.updated_at) {
      return;
    }
    // During an active search only inject a resolved-task header when the task itself matches; a task whose
    // note matched still surfaces via that note's sub-group above (T-all-2235 / Q-all-176).
    if (resolvedTaskMatchIds && !resolvedTaskMatchIds.has(task.id)) {
      return;
    }
    const dayKey = getLocalDayKey(task.updated_at, task.tz || viewerTz);
    if (!dayKey) {
      return;
    }
    const day = ensureDay(dayKey);
    ensureSubGroup(day, task).isResolvedHere = true;
  });

  return _.orderBy( 
    Object.values(byDay).map((day) => {
      const jobLevelNotes = _.orderBy(day.jobLevelNotes, ['updated_at'], ['desc']);
      const subGroups = _.orderBy(
        Object.values(day.bySubTaskId).map((sg) => {
          const notesDesc = _.orderBy(sg.notes, ['updated_at'], ['desc']);
          const firstNoteTs = _.first(notesDesc)?.updated_at || 0;
          const resolveTs = sg.isResolvedHere ? sg.task.updated_at : 0;
          const timestamp = firstNoteTs > resolveTs ? firstNoteTs : resolveTs;
          return { ...sg, notes: notesDesc, timestamp };
        }),
        ['timestamp'],
        ['desc']
      );
      
      const jobLevelTimestamp = _.first(jobLevelNotes)?.updated_at || 0;
      const subGroupTimestamp = _.first(subGroups)?.timestamp || 0;
      return {
        dayKey: day.dayKey,
        timestamp: jobLevelTimestamp > subGroupTimestamp ? jobLevelTimestamp : subGroupTimestamp,
        jobLevelNotes,
        subGroups
      };
    }),
    ['dayKey'],
    ['desc']
  );
}
