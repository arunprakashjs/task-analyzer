const STORAGE_KEY = 'taskAnalyzerData_v1';

let tasks = [];
let completedTasks = [];

/* ---------- Storage Helpers ---------- */

function saveToStorage() {
    const payload = { tasks, completedTasks };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
}

function loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        tasks = Array.isArray(data.tasks) ? data.tasks : [];
        completedTasks = Array.isArray(data.completedTasks) ? data.completedTasks : [];
    } catch (e) {
        console.error("Failed to parse localStorage data", e);
    }
}

/* ---------- UI Helpers ---------- */

function refreshTaskPreview() {
    const preview = document.getElementById('taskListPreview');
    preview.textContent = JSON.stringify(
        { tasks, completedTasks },
        null,
        2
    );
}

function renderTaskLists() {
    const todoList = document.getElementById('todoList');
    const completedList = document.getElementById('completedList');

    todoList.innerHTML = '';
    completedList.innerHTML = '';

    // Render todo tasks
    tasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${task.title}</strong>
            <div class="small-meta">
                ${task.due_date ? `Due: ${task.due_date}` : 'No due date'} |
                Importance: ${task.importance} |
                Hours: ${task.estimated_hours}
            </div>
        `;
        const btn = document.createElement('button');
        btn.textContent = 'Mark as Completed';
        btn.addEventListener('click', () => {
            markTaskAsCompleted(index);
        });
        li.appendChild(btn);
        todoList.appendChild(li);
    });

    // Render completed tasks
    completedTasks.forEach((task, index) => {
        const li = document.createElement('li');
        li.innerHTML = `
            <strong>${task.title}</strong>
            <div class="small-meta">
                ${task.due_date ? `Due: ${task.due_date}` : 'No due date'} |
                Importance: ${task.importance} |
                Hours: ${task.estimated_hours}
            </div>
        `;
        const btn = document.createElement('button');
        btn.textContent = 'Mark as Todo';
        btn.addEventListener('click', () => {
            moveTaskBackToTodo(index);
        });
        li.appendChild(btn);
        completedList.appendChild(li);
    });
}

function setStatus(message, isError = false) {
    const status = document.getElementById('status');
    status.textContent = message;
    status.style.color = isError ? 'red' : '#111827';
}

function priorityClass(label) {
    if (label === 'High') return 'high';
    if (label === 'Medium') return 'medium';
    return 'low';
}

function priorityBadgeClass(label) {
    if (label === 'High') return 'badge-high';
    if (label === 'Medium') return 'badge-medium';
    return 'badge-low';
}

function displayResults(data) {
    const container = document.getElementById('results');
    container.innerHTML = '';

    const tasksResult = data.tasks || [];

    tasksResult.forEach(task => {
        const card = document.createElement('div');
        card.className = `task-card ${priorityClass(task.priority_label)}`;

        const header = document.createElement('div');
        header.className = 'task-header';

        const title = document.createElement('div');
        title.className = 'task-title';
        title.textContent = task.title;

        const rightSide = document.createElement('div');
        rightSide.className = 'task-score';
        rightSide.innerHTML = `
            <span class="badge ${priorityBadgeClass(task.priority_label)}">${task.priority_label}</span>
            &nbsp;Score: ${task.score}
        `;

        header.appendChild(title);
        header.appendChild(rightSide);

        const meta = document.createElement('div');
        meta.className = 'task-meta';
        meta.textContent = [
            task.due_date ? `Due: ${task.due_date}` : 'No due date',
            `Importance: ${task.importance}`,
            `Estimated hours: ${task.estimated_hours}`,
            task.dependencies && task.dependencies.length
                ? `Dependencies: [${task.dependencies.join(', ')}]`
                : 'Dependencies: none',
        ].join(' | ');

        const explanation = document.createElement('div');
        explanation.className = 'task-explanation';
        explanation.textContent = task.explanation;

        card.appendChild(header);
        card.appendChild(meta);
        card.appendChild(explanation);

        container.appendChild(card);
    });
}

/* ---------- Task actions ---------- */

function markTaskAsCompleted(index) {
    const [task] = tasks.splice(index, 1);
    if (!task) return;
    completedTasks.push(task);
    saveToStorage();
    refreshTaskPreview();
    renderTaskLists();
}

function moveTaskBackToTodo(index) {
    const [task] = completedTasks.splice(index, 1);
    if (!task) return;
    tasks.push(task);
    saveToStorage();
    refreshTaskPreview();
    renderTaskLists();
}

/* ---------- Form Handling (Add Task) ---------- */

document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const due_date = document.getElementById('due_date').value || null;
    const estimated_hours = parseInt(document.getElementById('estimated_hours').value, 10) || 1;
    const importance = parseInt(document.getElementById('importance').value, 10) || 5;
    const depsRaw = document.getElementById('dependencies').value.trim();

    // 2️⃣ Validation: block past dates
    const todayStr = new Date().toISOString().split('T')[0]; // 'YYYY-MM-DD'
    if (due_date && due_date < todayStr) {
        alert("Due date cannot be in the past. Please choose today or a future date.");
        return;
    }

    let dependencies = [];
    if (depsRaw) {
        dependencies = depsRaw
            .split(',')
            .map(s => s.trim())
            .filter(s => s.length > 0)
            .map(s => parseInt(s, 10))
            .filter(n => !Number.isNaN(n));
    }

    const task = {
        title,
        due_date,
        estimated_hours,
        importance,
        dependencies,
        completed: false,
    };

    tasks.push(task);
    saveToStorage();
    refreshTaskPreview();
    renderTaskLists();

    // Clear some fields for convenience
    document.getElementById('title').value = '';
    document.getElementById('dependencies').value = '';
});

/* ---------- Load JSON into tasks ---------- */

document.getElementById('loadJsonBtn').addEventListener('click', () => {
    const text = document.getElementById('taskInput').value.trim();
    if (!text) return;

    try {
        const parsed = JSON.parse(text);
        let incomingTasks = [];

        if (Array.isArray(parsed)) {
            incomingTasks = parsed;
        } else if (parsed.tasks && Array.isArray(parsed.tasks)) {
            incomingTasks = parsed.tasks;
        } else {
            alert("JSON must be an array or an object with a 'tasks' array.");
            return;
        }

        const todayStr = new Date().toISOString().split('T')[0];

        // Filter out tasks with past dates
        const validTasks = [];
        let skippedCount = 0;

        incomingTasks.forEach(t => {
            const d = t.due_date;
            if (d && d < todayStr) {
                skippedCount++;
                return;
            }
            validTasks.push({
                title: t.title || 'Untitled Task',
                due_date: d || null,
                estimated_hours: t.estimated_hours || 1,
                importance: t.importance || 5,
                dependencies: Array.isArray(t.dependencies) ? t.dependencies : [],
                completed: false,
            });
        });

        tasks = validTasks;
        completedTasks = []; // Reset completed when loading bulk JSON
        saveToStorage();
        refreshTaskPreview();
        renderTaskLists();

        if (skippedCount > 0) {
            alert(`${skippedCount} task(s) were skipped because they had past due dates.`);
        }

    } catch (e) {
        console.error(e);
        alert("Invalid JSON. Please check your input.");
    }
});

/* ---------- API Calls ---------- */

async function callApi(endpoint) {
    if (!tasks.length) {
        alert("Please add at least one todo task.");
        return;
    }

    const strategy = document.getElementById('strategySelect').value;
    setStatus("Analyzing tasks...");

    try {
        const response = await fetch(`/api/tasks/${endpoint}/?strategy=${strategy}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            // Only send TODO tasks for analysis
            body: JSON.stringify({ tasks }),
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(text || `Request failed with status ${response.status}`);
        }

        const data = await response.json();
        displayResults(data);
        setStatus(`Done using strategy: ${data.strategy}`);
    } catch (err) {
        console.error(err);
        setStatus("Error: " + err.message, true);
        alert("Failed to analyze tasks. Check console for details.");
    }
}

document.getElementById('analyzeBtn').addEventListener('click', () => {
    callApi('analyze');
});

document.getElementById('suggestBtn').addEventListener('click', () => {
    callApi('suggest');
});

/* ---------- Initialization ---------- */

// 1. Load from localStorage
loadFromStorage();

// 2. Set min attribute on date input to block past dates in the picker
const dueDateInput = document.getElementById('due_date');
if (dueDateInput) {
    const todayStr = new Date().toISOString().split('T')[0];
    dueDateInput.min = todayStr;
}

// 3. Initial UI render
refreshTaskPreview();
renderTaskLists();