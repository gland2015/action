$Env:ACT_SESSION_ID = $PID
$Env:ACT_SESSION_TYPE = "PowerShell"
node $PSScriptRoot"\src\client\index.js" $args

$postExecStr = node.exe $PSScriptRoot"\src\client\getPostExec.js"
if ($postExecStr) {
    Invoke-Expression $postExecStr
}

