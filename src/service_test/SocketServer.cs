using System;
using System.Collections.Generic;
using System.Text;
using System.Threading;
using System.Net.Sockets;
using System.Net;


namespace SocketServerSpace
{
    abstract public class SocketServer
    {

        private static int PORT = 8098;
        private static String HOST = "127.0.0.1";

        abstract public String handleCommand(string msg);

        static Socket socketwatch = null;
        static Dictionary<string, Socket> clientConnectionItems = new Dictionary<string, Socket> { };
        public void Init()
        {
            socketwatch = new Socket(AddressFamily.InterNetwork, SocketType.Stream, ProtocolType.Tcp);
            IPAddress address = IPAddress.Parse(HOST);
            IPEndPoint point = new IPEndPoint(address, PORT);

            socketwatch.Bind(point);
            socketwatch.Listen(100);
            Thread threadwatch = new Thread(watchconnecting);
            threadwatch.IsBackground = true;
            threadwatch.Start();

            Console.WriteLine("开启监听。。。");
            Console.WriteLine("点击输入任意数据回车退出程序。。。");
            Console.ReadKey();
            Console.WriteLine("退出监听，并关闭程序。");
        }

        private void watchconnecting()
        {
            Socket connection = null;
            while (true)
            {
                try
                {
                    connection = socketwatch.Accept();
                }
                catch (Exception ex)
                {
                    Console.WriteLine(ex.Message);
                    break;
                }

                string remoteEndPoint = connection.RemoteEndPoint.ToString();
                clientConnectionItems.Add(remoteEndPoint, connection);

                ParameterizedThreadStart pts = new ParameterizedThreadStart(recv);
                Thread thread = new Thread(pts);
                thread.IsBackground = true;
                thread.Start(connection);
            }
        }

        private void recv(object socketclientpara)
        {
            Socket socketServer = socketclientpara as Socket;

            while (true)
            {
                byte[] arrServerRecMsg = new byte[1024 * 1024];
                try
                {
                    int length = socketServer.Receive(arrServerRecMsg);

                    string strSRecMsg = Encoding.UTF8.GetString(arrServerRecMsg, 0, length);
                    string result = handleCommand(strSRecMsg) + "~$end";
                    var msg = Encoding.UTF8.GetBytes(result);
                    socketServer.Send(msg);
                }
                catch
                {
                    clientConnectionItems.Remove(socketServer.RemoteEndPoint.ToString());
                    socketServer.Close();
                    break;
                }
            }
        }

    }
}