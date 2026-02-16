#!/usr/bin/env python3
"""Confrontation detector hook voor revision-guardian.

Detecteert wanneer de gebruiker Claude confronteert met een fout.
Injecteert instructie om NIET te rationaliseren.
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
        CONFRONTATION_PATTERNS, CONFRONTATION_THRESHOLD,
        compile_patterns, check_weighted_patterns,
    )
    from lib.state import load_state, save_state
except ImportError:
    print(json.dumps({}))
    sys.exit(0)


COMPILED_CONFRONTATION = compile_patterns(CONFRONTATION_PATTERNS)

CONFRONTATION_MESSAGE = (
    "## REVISION GUARDIAN \u2014 CONFRONTATIE GEDETECTEERD\n\n"
    "De gebruiker wijst je op een fout. Volg dit protocol STRIKT:\n\n"
    "1. **ERKEN** de fout direct en eerlijk\n"
    "2. **RATIONALISEER NIET** \u2014 geen 'technisch gezien', 'eigenlijk wel', "
    "'als je het zo bekijkt'\n"
    "3. **FIX** het probleem onmiddellijk\n"
    "4. **CONTROLEER** of dezelfde fout elders in je eerdere output voorkomt\n"
    "5. **BIED AAN** om alle eerdere output te herzien\n\n"
    "Gebruik deze formulering:\n"
    "'Je hebt gelijk, [beschrijf de fout]. Ik pas dit aan. "
    "Zal ik ook de eerdere [items/content] controleren op dezelfde fout?'\n\n"
    "VERBODEN reacties:\n"
    "- 'Dat was bewust zo gedaan'\n"
    "- 'Technisch gezien klopt het'\n"
    "- 'Er is een reden waarom...'\n"
    "- 'Als je het vanuit X perspectief bekijkt...'\n"
    "- Elke vorm van uitleg WAAROM de fout er zat, tenzij de gebruiker erom vraagt"
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

    triggered, matched = check_weighted_patterns(
        user_prompt, COMPILED_CONFRONTATION, CONFRONTATION_THRESHOLD
    )

    if triggered:
        state = load_state()
        state["confrontation_count"] = state.get("confrontation_count", 0) + 1
        save_state(state)
        print(json.dumps({"systemMessage": CONFRONTATION_MESSAGE}))
    else:
        print(json.dumps({}))

    sys.exit(0)


if __name__ == '__main__':
    main()
