#!/usr/bin/env python3
"""Sessie state tracking voor revision-guardian.

Gebruikt een JSON bestand in een temp directory om state
bij te houden tussen hook-aanroepen in dezelfde sessie.
"""

import json
import tempfile
from pathlib import Path

STATE_DIR = Path(tempfile.gettempdir()) / "revision-guardian"
STATE_FILE = STATE_DIR / "session_state.json"

DEFAULT_STATE = {
    "session_started": False,
    "prompt_count": 0,
    "feedback_detected": False,
    "feedback_prompts": [],
    "confrontation_count": 0,
}


def load_state() -> dict:
    """Laad sessie state. Returns dict met defaults als bestand niet bestaat."""
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    try:
        if STATE_FILE.exists():
            return json.loads(STATE_FILE.read_text(encoding="utf-8"))
    except (json.JSONDecodeError, IOError, OSError):
        pass
    return dict(DEFAULT_STATE)


def save_state(state: dict) -> None:
    """Sla sessie state op."""
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    try:
        STATE_FILE.write_text(
            json.dumps(state, ensure_ascii=False, indent=2),
            encoding="utf-8"
        )
    except (IOError, OSError):
        pass


def reset_state() -> None:
    """Reset state (voor nieuwe sessie)."""
    try:
        if STATE_FILE.exists():
            STATE_FILE.unlink()
    except (IOError, OSError):
        pass
