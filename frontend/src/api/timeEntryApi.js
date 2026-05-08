// 1. Apne banaye huye common axios instance ko use karen (axios.js wala)
import api from './axios'; 

export const startTimeEntry = (taskId) => {
    // Note the '/' at the end: matches FastAPI's strict routing
    return api.post('/time-entries/', {
        task_id: taskId,
        start_time: new Date().toISOString(),
        note: "Session started"
    });
};

export const stopTimeEntry = (entryId, note = "Session completed") => {
    // Ensuring the trailing slash is present before the ID or after
    return api.patch(`/time-entries/${entryId}`, {
        end_time: new Date().toISOString(),
        note: note
    });
};