# Security Compliance Rapport

**Project:** {{project_name}}
**Datum:** {{date}}
**Score:** {{score}}/100

---

## Executive Summary

Totaal bevindingen: {{total_findings}}
- CRITICAL: {{critical_count}}
- HIGH: {{high_count}}
- MEDIUM: {{medium_count}}
- LOW: {{low_count}}

Score trend: {{trend}} (vorige scan: {{previous_score}}/100)

---

## Bevindingen per Laag

### 1. Secrets
{{secrets_findings}}

### 2. Dependencies
{{deps_findings}}

### 3. Code (SAST)
{{code_findings}}

### 4. Containers
{{container_findings}}

### 5. Database
{{db_findings}}

### 6. Access Control
{{access_findings}}

### 7. Storage
{{storage_findings}}

---

## OWASP Top 10 Status

| ID | Categorie | Status |
|----|-----------|--------|
| A01 | Broken Access Control | {{a01_status}} |
| A02 | Cryptographic Failures | {{a02_status}} |
| A03 | Injection | {{a03_status}} |
| A04 | Insecure Design | {{a04_status}} |
| A05 | Security Misconfiguration | {{a05_status}} |
| A06 | Vulnerable Components | {{a06_status}} |
| A07 | Auth Failures | {{a07_status}} |
| A08 | Data Integrity Failures | {{a08_status}} |
| A09 | Logging Failures | {{a09_status}} |
| A10 | SSRF | {{a10_status}} |

---

## AVG/GDPR Basis Check

- [ ] Persoonsgegevens geidentificeerd en gedocumenteerd
- [ ] Verwerking rechtmatig (toestemming/contract/wettelijke verplichting)
- [ ] Data minimalisatie toegepast
- [ ] Beveiligingsmaatregelen geimplementeerd (encryptie, access control)
- [ ] Data retention beleid gedefinieerd

---

## Actieplan

### Kritiek (binnen 24 uur)
{{critical_actions}}

### Hoog (binnen 1 week)
{{high_actions}}

### Medium (binnen 1 maand)
{{medium_actions}}
