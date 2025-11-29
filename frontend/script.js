const STORAGE_KEY = 'taskAnalyzerData_v2';

let tasks = [];

/* ---------- Storage Helpers ---------- */

function saveToStorage() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
}

function loadFromStorage() {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    try {
        const data = JSON.parse(raw);
        tasks = Array.isArray(data) ? data : [];
    } catch (e) {
        console.error("Failed to parse localStorage data", e);
    }
}

/* ---------- UI Helpers ---------- */

function renderTaskLists() {
    const todoList = document.getElementById('todoList');
    todoList.innerHTML = '';

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
            deleteTask(index);
        });

        li.appendChild(btn);
        todoList.appendChild(li);
    });
}

function deleteTask(index) {
    // Remove the task from the todo list
    tasks.splice(index, 1);
    saveToStorage();
    renderTaskLists();

    // Also clear old analysis results on the right side
    const results = document.getElementById('results');
    if (results) {
        results.innerHTML = '';
    }

    // Update the status message
    setStatus('Task list updated. Click "Analyze" or "Suggest Top 3" to see updated priorities.');
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

/* ---------- Add Task (Form) ---------- */

document.getElementById('taskForm').addEventListener('submit', (e) => {
    e.preventDefault();

    const title = document.getElementById('title').value.trim();
    const due_date = document.getElementById('due_date').value || null;
    const estimated_hours = parseInt(document.getElementById('estimated_hours').value, 10) || 1;
    const importance = parseInt(document.getElementById('importance').value, 10) || 5;
    const depsRaw = document.getElementById('dependencies').value.trim();

    // Validate: due date cannot be in the past
    const todayStr = new Date().toISOString().split('T')[0];
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
    };

    tasks.push(task);
    saveToStorage();
    renderTaskLists();

    // Clear some fields
    document.getElementById('title').value = '';
    document.getElementById('dependencies').value = '';
});

/* ---------- API Calls ---------- */

async function callApi(endpoint) {
    if (!tasks.length) {
        alert("Please add at least one task.");
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

loadFromStorage();
renderTaskLists();

// Set minimum date to today so past dates can't be picked
const dueDateInput = document.getElementById('due_date');
if (dueDateInput) {
    const todayStr = new Date().toISOString().split('T')[0];
    dueDateInput.min = todayStr;
}
