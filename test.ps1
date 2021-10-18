$img = Get-DiskImage -ImagePath F:\project\my_npm_package.vhdx
Write-Output $img
$vol = Get-Volume -DiskImage $img
Write-Output $vol

# //  