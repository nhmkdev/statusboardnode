@REM - Super complex batch file to continuously run the server
@ECHO OFF
:START
node.exe statusboard_server.js
GOTO :START
