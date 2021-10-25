@REM node %~dp0/src/client/index.js %*
for /f %%a in ('node %~dp0/src/client/getPostExec.js') do set "postExecOutPut=%%a"
@REM @echo on
echo %postExecOutPut%
