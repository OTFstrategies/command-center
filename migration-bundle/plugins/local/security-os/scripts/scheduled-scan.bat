@echo off
REM Security OS - Scheduled Daily Scan
REM Run via Windows Task Scheduler

set TIMESTAMP=%date:~-4%%date:~3,2%%date:~0,2%-%time:~0,2%%time:~3,2%
set LOGFILE=%USERPROFILE%\.claude\security\scan-results\history\scheduled-%TIMESTAMP%.txt

echo [%date% %time%] Starting scheduled security scan >> "%LOGFILE%"
claude -p "/security-scan --all" --allowedTools "Bash,Read,Write,Grep,Glob,Task" >> "%LOGFILE%" 2>&1
echo [%date% %time%] Scan completed >> "%LOGFILE%"
