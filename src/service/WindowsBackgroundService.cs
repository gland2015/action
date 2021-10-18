using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;
using System;
using System.Threading;
using System.Threading.Tasks;

using CommandServiceSpace;

namespace App.WindowsService
{
    public sealed class WindowsBackgroundService : BackgroundService
    {
        private readonly CommandService _commandService;
        private readonly ILogger<WindowsBackgroundService> _logger;

        public WindowsBackgroundService(
            CommandService commandService,
            ILogger<WindowsBackgroundService> logger) =>
            (_commandService, _logger) = (commandService, logger);

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                _commandService.Init();

                await Task.Delay(-1, stoppingToken);
            }
        }

        // public override async Task StartAsync(CancellationToken stoppingToken)
        // {
        //     // await Task.Run()
        // }

    }
}