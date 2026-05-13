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
// Day groups are sorted ascending (oldest at top, today at bottom) per Q-all-60.
// Sub-groups within a day are sorted ascending by their `timestamp` per Q-all-57
// ("whichever task has the later notes displays later"). Job-level notes for the
// day render above all sub-groups, with no sub-header, per Q-all-55.
//
// Day membership uses the comment's `tz` field (creator's IANA zone) when present,
// falling back to viewerTz, per Q-all-59. The note's bucketing key is
// floor(updated_at) per Q-all-54, and a resolved task's day is
// floor(task.updated_at) per Q-all-62 (resolved comments cannot be edited so
// updated_at reflects the resolve event).
export function groupNotesByDay(notes, tasks, viewerTz) {
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
    const dayKey = getLocalDayKey(task.updated_at, task.tz || viewerTz);
    if (!dayKey) {
      return;
    }
    const day = ensureDay(dayKey);
    ensureSubGroup(day, task).isResolvedHere = true;
  });

  return _.orderBy(
    Object.values(byDay).map((day) => {
      const jobLevelNotes = _.orderBy(day.jobLevelNotes, ['updated_at'], ['asc']);
      const subGroups = _.orderBy(
        Object.values(day.bySubTaskId).map((sg) => {
          const notesAsc = _.orderBy(sg.notes, ['updated_at'], ['asc']);
          const lastNoteTs = _.last(notesAsc)?.updated_at;
          const resolveTs = sg.isResolvedHere ? sg.task.updated_at : undefined;
          const timestamp = [lastNoteTs, resolveTs].filter(Boolean).sort().pop();
          return { ...sg, notes: notesAsc, timestamp };
        }),
        ['timestamp'],
        ['asc']
      );
      const dayTimestamp = [
        _.last(jobLevelNotes)?.updated_at,
        _.last(subGroups)?.timestamp
      ].filter(Boolean).sort().pop();
      return {
        dayKey: day.dayKey,
        timestamp: dayTimestamp,
        jobLevelNotes,
        subGroups
      };
    }),
    ['dayKey'],
    ['asc']
  );
}
