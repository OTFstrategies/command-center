---
allowed-tools: Bash(python*), AskUserQuestion
description: Synchroniseer taken met Vibe Kanban
---

# Vibe Kanban Sync Command

Je bent een assistent die taken synchroniseert met Vibe Kanban.

## Configuratie

- **Database**: `C:\Users\Shadow\AppData\Roaming\bloop\vibe-kanban\data\db.sqlite`
- **Sessie bestand**: `C:\Users\Shadow\.claude\.vibe-sync-session.json`
- **Statussen**: `todo`, `in_progress`, `done`

## Arguments

De gebruiker kan deze command aanroepen met: `$ARGUMENTS`

## Actie bepalen

Analyseer `$ARGUMENTS`:
- Leeg of geen argumenten → **sync actie** (analyseer gesprek)
- `project {naam}` → **set project actie**
- `status` → **status actie**
- `list` → **list actie**

## Python Helper Code

Gebruik dit Python script voor alle database operaties:

```python
import sqlite3
import json
import os
import uuid
from datetime import datetime

DB_PATH = r'C:\Users\Shadow\AppData\Roaming\bloop\vibe-kanban\data\db.sqlite'
SESSION_PATH = r'C:\Users\Shadow\.claude\.vibe-sync-session.json'

def get_connection():
    return sqlite3.connect(DB_PATH)

def uuid_to_bytes(uuid_str):
    """Convert UUID string to bytes for SQLite BLOB"""
    return uuid.UUID(uuid_str).bytes

def bytes_to_uuid(b):
    """Convert SQLite BLOB bytes to UUID string"""
    return str(uuid.UUID(bytes=b))

# === SESSION MANAGEMENT ===

def get_session():
    """Lees actief project uit sessie bestand"""
    if os.path.exists(SESSION_PATH):
        with open(SESSION_PATH, 'r') as f:
            return json.load(f)
    return None

def set_session(project_name, project_id):
    """Sla actief project op in sessie bestand"""
    data = {
        "active_project": project_name,
        "project_id": project_id
    }
    os.makedirs(os.path.dirname(SESSION_PATH), exist_ok=True)
    with open(SESSION_PATH, 'w') as f:
        json.dump(data, f, indent=2)
    return data

# === PROJECT OPERATIONS ===

def list_projects():
    """Lijst alle projecten met task counts"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name FROM projects ORDER BY name')
    projects = []
    for row in cursor.fetchall():
        project_id = row[0]
        name = row[1]
        # Get counts per status
        cursor.execute('''
            SELECT status, COUNT(*) FROM tasks
            WHERE project_id = ?
            GROUP BY status
        ''', (project_id,))
        counts = {r[0]: r[1] for r in cursor.fetchall()}
        projects.append({
            'id': bytes_to_uuid(project_id),
            'name': name,
            'todo': counts.get('todo', 0),
            'in_progress': counts.get('in_progress', 0),
            'done': counts.get('done', 0)
        })
    conn.close()
    return projects

def find_project_by_name(name):
    """Zoek project op naam (case-insensitive)"""
    conn = get_connection()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name FROM projects WHERE LOWER(name) = LOWER(?)', (name,))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {'id': bytes_to_uuid(row[0]), 'name': row[1]}
    return None

# === TASK OPERATIONS ===

def list_tasks(project_id, status=None):
    """Lijst taken voor een project, optioneel gefilterd op status"""
    conn = get_connection()
    cursor = conn.cursor()
    project_bytes = uuid_to_bytes(project_id)

    if status:
        cursor.execute('''
            SELECT id, title, description, status, created_at, updated_at
            FROM tasks WHERE project_id = ? AND status = ?
            ORDER BY created_at
        ''', (project_bytes, status))
    else:
        cursor.execute('''
            SELECT id, title, description, status, created_at, updated_at
            FROM tasks WHERE project_id = ?
            ORDER BY status, created_at
        ''', (project_bytes,))

    tasks = []
    for row in cursor.fetchall():
        tasks.append({
            'id': bytes_to_uuid(row[0]),
            'title': row[1],
            'description': row[2],
            'status': row[3],
            'created_at': row[4],
            'updated_at': row[5]
        })
    conn.close()
    return tasks

def update_task_status(task_id, new_status):
    """Update de status van een taak"""
    conn = get_connection()
    cursor = conn.cursor()
    task_bytes = uuid_to_bytes(task_id)
    now = datetime.utcnow().isoformat() + 'Z'
    cursor.execute('''
        UPDATE tasks SET status = ?, updated_at = ?
        WHERE id = ?
    ''', (new_status, now, task_bytes))
    conn.commit()
    affected = cursor.rowcount
    conn.close()
    return affected > 0

def add_task(project_id, title, description=''):
    """Voeg een nieuwe taak toe"""
    conn = get_connection()
    cursor = conn.cursor()
    task_id = uuid.uuid4()
    project_bytes = uuid_to_bytes(project_id)
    now = datetime.utcnow().isoformat() + 'Z'
    cursor.execute('''
        INSERT INTO tasks (id, project_id, title, description, status, created_at, updated_at)
        VALUES (?, ?, ?, ?, 'todo', ?, ?)
    ''', (task_id.bytes, project_bytes, title, description, now, now))
    conn.commit()
    conn.close()
    return str(task_id)

def find_task_by_title(project_id, title_search):
    """Zoek taak op titel (fuzzy match)"""
    conn = get_connection()
    cursor = conn.cursor()
    project_bytes = uuid_to_bytes(project_id)
    # Exact match first
    cursor.execute('''
        SELECT id, title, status FROM tasks
        WHERE project_id = ? AND LOWER(title) = LOWER(?)
    ''', (project_bytes, title_search))
    row = cursor.fetchone()
    if row:
        conn.close()
        return {'id': bytes_to_uuid(row[0]), 'title': row[1], 'status': row[2]}

    # Partial match
    cursor.execute('''
        SELECT id, title, status FROM tasks
        WHERE project_id = ? AND LOWER(title) LIKE ?
    ''', (project_bytes, f'%{title_search.lower()}%'))
    row = cursor.fetchone()
    conn.close()
    if row:
        return {'id': bytes_to_uuid(row[0]), 'title': row[1], 'status': row[2]}
    return None

def get_task_counts(project_id):
    """Haal task counts op per status"""
    conn = get_connection()
    cursor = conn.cursor()
    project_bytes = uuid_to_bytes(project_id)
    cursor.execute('''
        SELECT status, COUNT(*) FROM tasks
        WHERE project_id = ?
        GROUP BY status
    ''', (project_bytes,))
    counts = {r[0]: r[1] for r in cursor.fetchall()}
    conn.close()
    return {
        'todo': counts.get('todo', 0),
        'in_progress': counts.get('in_progress', 0),
        'done': counts.get('done', 0)
    }
```

## Instructies per Actie

### 1. SET PROJECT (`/vibe-sync project {naam}`)

1. Zoek het project in de database op naam
2. Als gevonden: sla op in sessie bestand en toon status
3. Als niet gevonden: toon beschikbare projecten

Voorbeeld output:
```
Actief project ingesteld: bryntum-analysis
Todo: 98 | In Progress: 0 | Done: 40
```

### 2. STATUS (`/vibe-sync status`)

1. Lees actief project uit sessie
2. Als geen project: vraag gebruiker om eerst project in te stellen
3. Toon counts per status

Voorbeeld output:
```
Project: bryntum-analysis
Todo: 98 | In Progress: 2 | Done: 40
```

### 3. LIST (`/vibe-sync list`)

1. Lees actief project uit sessie
2. Toon alle 'todo' taken (max 20, toon totaal als meer)

Voorbeeld output:
```
Todo taken voor bryntum-analysis:

1. gantt-advanced: Observeer
2. gantt-advanced: Codeer UI
3. gantt-baselines: Observeer
... (95 meer)
```

### 4. SYNC (`/vibe-sync`)

Dit is de slimme sync functie:

1. **Check sessie** - Als geen actief project, vraag gebruiker om project
2. **Haal huidige taken op** - Lees alle taken voor het project
3. **Analyseer gesprek** - Kijk naar de conversatie historie:
   - Welke taken zijn expliciet "gedaan", "afgerond", "completed"?
   - Welke taken zijn we mee bezig ("working on", "bezig met")?
   - Zijn er nieuwe taken ontstaan uit het gesprek?
4. **Toon voorgestelde wijzigingen** - Laat zien wat er gaat veranderen:
   ```
   Voorgestelde wijzigingen:

   DONE:
     - "gantt-advanced: Observeer" (was: todo)
     - "gantt-advanced: Codeer UI" (was: in_progress)

   IN_PROGRESS:
     - "gantt-baselines: Observeer" (was: todo)

   NIEUW:
     - "gantt-resources: Onderzoek API" (todo)
   ```
5. **Vraag bevestiging** - Gebruik AskUserQuestion
6. **Voer wijzigingen door** - Update database en bevestig

## Belangrijk

- Gebruik ALTIJD de Python code via Bash om met de database te communiceren
- Wees conservatief met automatische detectie - vraag bij twijfel
- Toon altijd duidelijk wat er gaat veranderen voor bevestiging
- De UUID's in de database zijn opgeslagen als BLOB (bytes), niet als strings
