#!/usr/bin/env python3
"""Revision checkpoint — Stop hook voor revision-guardian.

Blokkeert stoppen als:
1. Feedback eerder gedetecteerd (uit state)
2. Batch content in transcript
3. GEEN revisie-bewijs in transcript
"""

import json
import sys
import os

PLUGIN_ROOT = os.environ.get('CLAUDE_PLUGIN_ROOT', '')
if PLUGIN_ROOT:
    if PLUGIN_ROOT not in sys.path:
        sys.path.insert(0, PLUGIN_ROOT)

try:
    from lib.patterns import (
        BATCH_CONTENT_PATTERNS, REVISION_EVIDENCE_PATTERNS,
        check_any_pattern,
    )
    from lib.state import load_state, reset_state
except ImportError:
    print(json.dumps({}))
    sys.exit(0)


BLOCK_MESSAGE = (
    "## REVISION GUARDIAN \u2014 STOP GEBLOKKEERD\n\n"
    "Er is batch content gegenereerd EN de gebruiker heeft mid-course "
    "feedback gegeven, maar er is GEEN bewijs dat eerdere content is herzien.\n\n"
    "**Je MOET eerst:**\n"
    "1. Ga terug naar de eerder gegenereerde content\n"
    "2. Controleer elk item tegen de feedback die de gebruiker gaf\n"
    "3. Pas items aan die niet voldoen aan de nieuwe inzichten\n"
    "4. Rapporteer aan de gebruiker welke items je hebt aangepast\n\n"
    "Pas daarna mag je de taak afronden."
)

WARN_MESSAGE = (
    "## REVISION GUARDIAN \u2014 Revisie Herinnering\n\n"
    "Er was feedback van de gebruiker tijdens deze sessie. "
    "Controleer of je ALLE eerder gegenereerde content hebt herzien "
    "tegen de laatste feedback/principes."
)


def read_transcript(input_data: dict) -> str:
    """Lees het transcript als het beschikbaar is."""
    transcript_path = input_data.get("transcript_path", "")
    if not transcript_path:
        return ""
    try:
        with open(transcript_path, "r", encoding="utf-8") as f:
            return f.read()
    except (IOError, OSError, UnicodeDecodeError):
        return ""


def main():
    try:
        input_data = json.load(sys.stdin)
    except (json.JSONDecodeError, IOError):
        print(json.dumps({}))
        sys.exit(0)

    state = load_state()

    # Als er geen feedback was, laat gewoon door
    if not state.get("feedback_detected", False):
        reset_state()
        print(json.dumps({}))
        sys.exit(0)

    # Lees transcript
    transcript = read_transcript(input_data)

    if not transcript:
        # Geen transcript beschikbaar — zachte waarschuwing (fail-open)
        reset_state()
        print(json.dumps({"systemMessage": WARN_MESSAGE}))
        sys.exit(0)

    # Check of er batch content was
    has_batch = check_any_pattern(transcript, BATCH_CONTENT_PATTERNS)

    if not has_batch:
        # Geen batch content — revisie-faalpatroon niet van toepassing
        reset_state()
        print(json.dumps({}))
        sys.exit(0)

    # Er is batch content EN feedback — check op revisie bewijs
    has_revision = check_any_pattern(transcript, REVISION_EVIDENCE_PATTERNS)

    if not has_revision:
        # BLOKKEER: batch + feedback maar geen revisie
        print(json.dumps({
            "decision": "block",
            "reason": BLOCK_MESSAGE
        }))
    else:
        # Revisie gevonden — laat door met herinnering
        reset_state()
        print(json.dumps({"systemMessage": WARN_MESSAGE}))

    sys.exit(0)


if __name__ == '__main__':
    main()
