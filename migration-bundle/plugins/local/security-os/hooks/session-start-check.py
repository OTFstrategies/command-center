#!/usr/bin/env python3
"""Show security status at session start."""
import json
import sys
import os
from pathlib import Path


def main():
    scan_results = Path.home() / ".claude" / "security" / "scan-results" / "latest.json"

    if scan_results.exists():
        try:
            data = json.loads(scan_results.read_text(encoding="utf-8"))
            score = data.get("score", "?")
            critical = data.get("summary", {}).get("critical", 0)
            high = data.get("summary", {}).get("high", 0)
            scan_date = data.get("timestamp", "onbekend")

            if critical > 0 or high > 0:
                message = (
                    f"Security OS: Score {score}/100 | "
                    f"{critical} critical, {high} high | "
                    f"Laatste scan: {scan_date}"
                )
            else:
                message = (
                    f"Security OS: Score {score}/100 | "
                    f"Geen critical/high issues | "
                    f"Laatste scan: {scan_date}"
                )

            # Always allow, just inform
            print(json.dumps({"decision": "allow", "reason": message}))
        except Exception:
            print(json.dumps({"decision": "allow"}))
    else:
        print(json.dumps({
            "decision": "allow",
            "reason": (
                "Security OS: Nog geen scan uitgevoerd. "
                "Gebruik /security-scan voor een eerste check."
            )
        }))


if __name__ == "__main__":
    main()
