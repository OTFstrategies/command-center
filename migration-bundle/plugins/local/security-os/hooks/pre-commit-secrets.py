#!/usr/bin/env python3
"""Pre-commit hook: scan staged files for secrets using gitleaks."""
import json
import subprocess
import sys
import os


def main():
    input_data = json.loads(sys.stdin.read())
    tool_input = input_data.get("tool_input", {})
    command = tool_input.get("command", "")

    # Only trigger on git commit commands
    if "git commit" not in command:
        print(json.dumps({"decision": "allow"}))
        return

    try:
        result = subprocess.run(
            ["gitleaks", "protect", "--staged", "--no-banner"],
            capture_output=True, text=True, timeout=25
        )
        if result.returncode != 0 and "leaks found" in result.stdout.lower():
            print(json.dumps({
                "decision": "block",
                "reason": "Security OS: Secrets gevonden in staged files!\n"
                          + result.stdout
                          + "\nVerwijder secrets voor je commit."
            }))
        else:
            print(json.dumps({"decision": "allow"}))
    except FileNotFoundError:
        # gitleaks not installed - fail open
        print(json.dumps({"decision": "allow"}))
    except subprocess.TimeoutExpired:
        # Timeout - fail open
        print(json.dumps({"decision": "allow"}))
    except Exception:
        # Any other error - fail open
        print(json.dumps({"decision": "allow"}))


if __name__ == "__main__":
    main()
