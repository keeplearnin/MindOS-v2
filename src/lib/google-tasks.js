// Google Tasks API helper
const TASKS_API = 'https://tasks.googleapis.com/tasks/v1';

export async function fetchTaskLists(accessToken) {
  const res = await fetch(`${TASKS_API}/users/@me/lists`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google Tasks API error: ${res.status}`);
  const data = await res.json();
  return data.items || [];
}

export async function fetchGoogleTasks(accessToken, taskListId = '@default', showCompleted = false) {
  const params = new URLSearchParams({
    maxResults: '100',
    showCompleted: showCompleted.toString(),
    showHidden: 'false',
  });
  const res = await fetch(`${TASKS_API}/lists/${taskListId}/tasks?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google Tasks API error: ${res.status}`);
  const data = await res.json();
  return (data.items || []).filter(t => t.title); // filter out empty tasks
}

export async function createGoogleTask(accessToken, taskListId = '@default', task) {
  const res = await fetch(`${TASKS_API}/lists/${taskListId}/tasks`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      title: task.title,
      notes: task.notes || '',
      due: task.due_date ? new Date(task.due_date).toISOString() : undefined,
      status: task.completed ? 'completed' : 'needsAction',
    }),
  });
  if (!res.ok) throw new Error(`Google Tasks API error: ${res.status}`);
  return res.json();
}

export async function updateGoogleTask(accessToken, taskListId, taskId, updates) {
  const res = await fetch(`${TASKS_API}/lists/${taskListId}/tasks/${taskId}`, {
    method: 'PATCH',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(updates),
  });
  if (!res.ok) throw new Error(`Google Tasks API error: ${res.status}`);
  return res.json();
}

export async function completeGoogleTask(accessToken, taskListId, taskId) {
  return updateGoogleTask(accessToken, taskListId, taskId, {
    status: 'completed',
  });
}

export async function deleteGoogleTask(accessToken, taskListId, taskId) {
  const res = await fetch(`${TASKS_API}/lists/${taskListId}/tasks/${taskId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${accessToken}` },
  });
  if (!res.ok) throw new Error(`Google Tasks API error: ${res.status}`);
}
