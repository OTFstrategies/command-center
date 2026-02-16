#!/usr/bin/env python3
"""Feedback/correction detector hook voor revision-guardian.

Detecteert wanneer de gebruiker mid-course correcties geeft of
nieuwe principes vaststelt. Injecteert instructie om ALLE eerdere
content te herzien.
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
        FEEDBACK_PATTERNS, FEEDBACK_THRESHOLD,
        compile_patterns, check_weighted_patterns,
    )
    from lib.state import load_state, save_state
except ImportError:
    print(json.dumps({}))
    sys.exit(0)


COMPILED_FEEDBACK = compile_patterns(FEEDBACK_PATTERNS)

FEEDBACK_MESSAGE = (
    "## REVISION GUARDIAN \u2014 KOERSCORRECTIE GEDETECTEERD\n\n"
    "De gebruiker geeft nieuwe feedback of stelt een nieuw principe vast.\n\n"
    "**VERPLICHT PROTOCOL:**\n\n"
    "1. **PAUZEER** je huidige taak\n"
    "2. **HERHAAL** het nieuwe principe/de correctie in je eigen woorden\n"
    "3. **VRAAG BEVESTIGING** of je het correct hebt begrepen\n"
    "4. **INVENTARISEER** alle content die je AL hebt gegenereerd in deze sessie\n"
    "5. **CONTROLEER** elk eerder gegenereerd item tegen het nieuwe principe\n"
    "6. **HERZIEN** items die niet voldoen\n"
    "7. **RAPPORTEER** welke items je hebt aangepast en waarom\n\n"
    "BELANGRIJK: Presenteer GEEN content die je al had voorbereid alsof die aan "
    "het nieuwe principe voldoet. Genereer opnieuw vanuit het nieuwe inzicht.\n\n"
    "Als je al een batch aan het genereren was:\n"
    "- STOP de huidige batch\n"
    "- Ga terug naar alle eerdere items\n"
    "- Pas ALLES aan met het nieuwe inzicht\n"
    "- Begin opnieuw, niet doorgaan met de oude lijn"
)


def main():
    try:
        input_data = json.load(sys.stdin)
    except (json.JSONDecodeError, IOError):
        print(json.dumps({}))
        sys.exit(0)

    user_prompt = input_data.get("user_prompt", "")
    if not user_prompt:
        print(json.dumps({}))
        sys.exit(0)

    # Altijd prompt teller verhogen
    state = load_state()
    state["prompt_count"] = state.get("prompt_count", 0) + 1

    triggered, matched = check_weighted_patterns(
        user_prompt, COMPILED_FEEDBACK, FEEDBACK_THRESHOLD
    )

    if triggered:
        state["feedback_detected"] = True
        feedback_prompts = state.get("feedback_prompts", [])
        feedback_prompts.append({
            "prompt_number": state.get("prompt_count", 0),
            "matched_patterns": matched,
            "prompt_preview": user_prompt[:200]
        })
        state["feedback_prompts"] = feedback_prompts
        save_state(state)
        print(json.dumps({"systemMessage": FEEDBACK_MESSAGE}))
    else:
        save_state(state)
        print(json.dumps({}))

    sys.exit(0)


if __name__ == '__main__':
    main()
