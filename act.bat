@echo off
set ACT_SESSION_ID=%random%%random%%random%%random%
set ACT_SESSION_TYPE=CommandPrompt
node %~dp0\src\client\index.js %*
for /f "tokens=* delims=" %%a in ('node %~dp0src\client\getPostExec.js') do call %%a

