// WARNING: this mirrors the back end archive screen in uclusion_summaries
// handlers/get_object_versions.py - change both constants together or archived
// jobs silently render with empty comments again (J-all-331)
export const ARCHIVED_COMMENTS_SCREEN_MILLIS = 90 * 86400000;

export const QUESTION_TYPE = 'QUESTION';
export const ISSUE_TYPE = 'ISSUE';
export const TODO_TYPE = 'TODO';
export const SUGGEST_CHANGE_TYPE = 'SUGGEST';
export const REPLY_TYPE = 'REPLY';
export const REPORT_TYPE = 'REPORT';
export const JUSTIFY_TYPE = 'JUSTIFY';