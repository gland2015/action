
using System;
using System.Management.Automation;
using System.Text.Json;
class Shell
{
    static PowerShell ps = PowerShell.Create();
    public static void Init()
    {

        ps.AddScript("Set-ExecutionPolicy -ExecutionPolicy Bypass -Scope Process");
        ps.AddScript("Import-Module -Name Storage -Global");
        ps.AddScript("Import-Module -Name CimCmdlets -Global");
        ps.AddScript("Import-Module -Name Microsoft.PowerShell.Utility -Global");
        ps.AddScript("Import-Module -Name Microsoft.PowerShell.Management -Global");
        ps.AddScript("Get-PhysicalDisk | Get-Disk | Get-Partition | Get-Volume | ConvertTo-Json -Depth 10");
        ps.Invoke();
        ps.Commands.Clear();
        Console.WriteLine("shell");
    }

    public static string GetVolumeByVhdFile(string filepath)
    {
        ps.Commands.Clear();
        ps.AddScript("Get-DiskImage -ImagePath " + filepath.Trim() + " | Get-Disk | Get-Partition | Get-Volume | ConvertTo-Json -Depth 10");
        var invokeRes = ps.Invoke();
        string result = "\"\"";
        if (invokeRes.Count != 0)
        {
            result = invokeRes[0].ToString();
        }
        return result;
    }
    public static string GetVolumeBySerialNumber(string serialNumber)
    {
        ps.Commands.Clear();
        ps.AddScript("Get-PhysicalDisk | ConvertTo-Json -Depth 10"); //  -SerialNumber 184379401433 | Get-Disk | Get-Partition | Get-Volume
        // ps.AddScript("Get-PhysicalDisk -SerialNumber " + serialNumber + " | Get-Disk | Get-Partition | Get-Volume | ConvertTo-Json -Depth 10");
        // ps.AddScript("Get-CimInstance -ClassName MSFT_PhysicalDisk -Namespace Root/Microsoft/Windows/Storage | ConvertTo-Json -Depth 10");
        // ps.AddScript("Get-Partition -DiskNumber (Get-Disk | Where-Object {$_.SerialNumber -Match " + serialNumber + "})[0].Number | Get-Volume | ConvertTo-Json -Depth 10");
        var a = ps.Streams.Error.ToString();
        var invokeRes = ps.Invoke();
        string result = "\"\"";
        if (invokeRes.Count != 0)
        {
            result = invokeRes[0].ToString();
        }
        return a;
    }
}