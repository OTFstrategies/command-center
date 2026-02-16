#!/usr/bin/env python3
"""Block writes to sensitive files."""
import json
import sys
import re

SENSITIVE_PATTERNS = [
    r'\.env$',
    r'\.env\.local$',
    r'\.env\.production$',
    r'\.env\.development$',
    r'\.pem$',
    r'\.key$',
    r'\.p12$',
    r'\.pfx$',
    r'credentials\.json$',
    r'secrets\.json$',
    r'\.credentials',
    r'service.account\.json$',
    r'id_rsa',
    r'id_ed25519',
]


def main():
    input_data = json.loads(sys.stdin.read())
    tool_input = input_data.get("tool_input", {})
    file_path = tool_input.get("file_path", "") or tool_input.get("path", "")

    for pattern in SENSITIVE_PATTERNS:
        if re.search(pattern, file_path, re.IGNORECASE):
            print(json.dumps({
                "decision": "block",
                "reason": (
                    f"Security OS: Schrijven naar gevoelig bestand geblokkeerd: {file_path}\n"
                    "Gebruik een veilige methode om credentials te beheren."
                )
            }))
            return

    print(json.dumps({"decision": "allow"}))


if __name__ == "__main__":
    main()
