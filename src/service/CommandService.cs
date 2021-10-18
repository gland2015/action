using System;
using System.Management.Automation;
using System.Text.Json;
using SocketServerSpace;
using System.Collections.Generic;
using System.Text;
using System.Diagnostics;

namespace CommandServiceSpace
{
    public class CommandService
    {
        public void Init()
        {
            Shell.Init();
            var socket = new Socket();
            socket.Init();

        }
    }

    public class DataMain
    {
        public long msgId { get; set; }
        public DataPayload payload { get; set; }
    }

    public class DataPayload
    {
        public string type { get; set; }
        public string[] args { get; set; }
    }

    public class DataResult
    {
        public long msgId { get; set; }
        public string payload { get; set; }
    }


    class Socket : SocketServer
    {
        public override String handleCommand(string msg)
        {
            DataMain data = null;
            try
            {
                byte[] strDecode = Convert.FromBase64String(msg);
                string strSRecMsg = Encoding.UTF8.GetString(strDecode);
                data = JsonSerializer.Deserialize<DataMain>(strSRecMsg);
            }
            catch
            {
                return "";
            }
            if (data == null)
            {
                return "";
            }
            long msgId = data.msgId;
            if (msgId == 0L)
            {
                return "";
            }
            DataPayload payload = data.payload;
            if (payload == null)
            {
                return "";
            }
            string type = payload.type;
            string[] args = payload.args;
            string runRes = "";
            if (type == "GetVolumeByVhdFile")
            {
                runRes = Shell.GetVolumeByVhdFile(args[0]);
            }
            else if (type == "GetVolumeBySerialNumber")
            {
                runRes = Shell.GetVolumeBySerialNumber(args[0]);
            }
            else if (type == "SetVhdFileMount")
            {
                runRes = Shell.SetVhdFileMount(args[0]);
            }
            else if (type == "SetVhdFileDisMount")
            {
                runRes = Shell.SetVhdFileDisMount(args[0]);
            }
            else if (type == "GetVhdFileDiskStatus")
            {
                runRes = Shell.GetVhdFileDiskStatus(args[0]);
            }

            var result = new DataResult();
            result.msgId = msgId;
            result.payload = runRes;

            var jsonStr = JsonSerializer.Serialize(result);
            var byteStr = System.Text.Encoding.UTF8.GetBytes(jsonStr);
            var base64Str = Convert.ToBase64String(byteStr);
            return base64Str;
        }
    }

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
            // ps.AddScript("Get-PhysicalDisk | ConvertTo-Json -Depth 10"); //  -SerialNumber 184379401433 | Get-Disk | Get-Partition | Get-Volume
            // ps.AddScript("Get-PhysicalDisk -SerialNumber " + serialNumber + " | Get-Disk | Get-Partition | Get-Volume | ConvertTo-Json -Depth 10");
            // ps.AddScript("Get-CimInstance -ClassName MSFT_PhysicalDisk -Namespace Root/Microsoft/Windows/Storage | ConvertTo-Json -Depth 10");
            ps.AddScript("Get-Partition -DiskNumber (Get-Disk | Where-Object {$_.SerialNumber -Match " + serialNumber + "})[0].Number | Get-Volume | ConvertTo-Json -Depth 10");
            var invokeRes = ps.Invoke();
            string result = "\"\"";
            if (invokeRes.Count != 0)
            {
                result = invokeRes[0].ToString();
            }
            return result;
        }
        public static string SetVhdFileMount(string filepath)
        {
            ps.Commands.Clear();
            ps.AddScript("Mount-DiskImage -ImagePath " + filepath);
            ps.Invoke();
            return "\"\"";
        }
        public static string SetVhdFileDisMount(string filepath)
        {
            ps.Commands.Clear();
            ps.AddScript("Dismount-DiskImage -ImagePath " + filepath);
            ps.Invoke();
            return "\"\"";
        }

        public static string GetVhdFileDiskStatus(string filepath)
        {
            ps.Commands.Clear();
            ps.AddScript("Get-DiskImage -ImagePath " + filepath + " | ConvertTo-Json -Depth 10");
            var invokeRes = ps.Invoke();
            string result = "\"\"";
            if (invokeRes.Count != 0)
            {
                result = invokeRes[0].ToString().Trim();
            }
            return result;
        }
    }
}

