# Smart Task Analyzer

A Django-powered web application that helps users **prioritize tasks intelligently** based on due date, importance, effort, and dependencies.  
This project is designed to demonstrate **backend + frontend integration**, clean architecture, scoring logic, and overall development workflow.

---

## 🚀 Features

### ✅ Task Management
- Add new tasks with:
  - Title  
  - Due date  
  - Estimated hours  
  - Importance (1–10 scale)  
  - Dependencies  
- Prevents adding tasks with **past due dates**
- Tasks stored in **localStorage** (persist even after refresh)
- Mark tasks as **completed** and remove instantly

### 🎯 Smart Task Analysis
Backend uses a custom scoring algorithm that factors:
- Urgency (how soon the due date is)
- Importance weight
- Quick-task bonuses (low-effort tasks)
- Dependency checks

### 🧠 Suggestion Engine
Returns top 3 tasks based on:
- Selected strategy  
- Overall score  
- Priority labels (High / Medium / Low)

### 🌐 API Endpoints
- `/api/tasks/analyze/` → Analyze all tasks  
- `/api/tasks/suggest/` → Return top 3 priority tasks  

### 🖥 Frontend UI
- Built with **HTML5, CSS3, Vanilla JS**
- Live task list
- Analysis panel with scores & explanations
- Dropdown strategy selector

---

## 🧩 Tech Stack

| Layer | Technology |
|-------|------------|
| Backend | Django 4.x, Python 3.x |
| Frontend | HTML, CSS, JavaScript |
| Storage | SQLite (Django default), Browser localStorage |
| Version Control | Git + GitHub |
| Environment | Virtualenv (venv) |

---

## 📂 Project Structure

task-analyzer/
├── backend/ # Main Django project
│ ├── settings.py
│ ├── urls.py
│ └── wsgi.py
│
├── tasks/ # Django app
│ ├── models.py
│ ├── views.py
│ ├── scoring.py
│ ├── urls.py
│ └── migrations/
│
├── frontend/ # Static UI
│ ├── index.html
│ ├── script.js
│ └── styles.css
│
├── venv/ # Virtual environment
├── manage.py
└── README.md