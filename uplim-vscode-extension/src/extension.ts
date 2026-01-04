import * as path from 'path';
import * as vscode from 'vscode';
import {
  LanguageClient,
  LanguageClientOptions,
  ServerOptions,
  TransportKind
} from 'vscode-languageclient/node';

let client: LanguageClient;

export function activate(context: vscode.ExtensionContext) {
  const serverModule = context.asAbsolutePath(
    path.join('..', 'uplim-lsp', 'out', 'server.js')
  );

  const serverOptions: ServerOptions = {
    run: { module: serverModule, transport: TransportKind.ipc },
    debug: {
      module: serverModule,
      transport: TransportKind.ipc,
      options: { execArgv: ['--nolazy', '--inspect=6009'] }
    }
  };

  const clientOptions: LanguageClientOptions = {
    documentSelector: [{ scheme: 'file', language: 'uplim' }],
    synchronize: {
      fileEvents: vscode.workspace.createFileSystemWatcher('**/*.upl')
    }
  };

  client = new LanguageClient(
    'uplimLanguageServer',
    'UPLim Language Server',
    serverOptions,
    clientOptions
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('uplim.restartLsp', async () => {
      await client.stop();
      await client.start();
      vscode.window.showInformationMessage('UPLim LSP restarted');
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('uplim.analyzeProject', async () => {
      const result = await client.sendRequest('uplim/analyzeProject');
      vscode.window.showInformationMessage(`Analysis complete: ${JSON.stringify(result)}`);
    })
  );

  context.subscriptions.push(
    vscode.commands.registerCommand('uplim.showEngineReport', async () => {
      const report = await client.sendRequest('uplim/engineReport');
      const panel = vscode.window.createWebviewPanel(
        'uplimReport',
        'UPLim Engine Report',
        vscode.ViewColumn.One,
        {}
      );
      panel.webview.html = generateReportHtml(report);
    })
  );

  client.start();
}

export function deactivate(): Thenable<void> | undefined {
  if (!client) {
    return undefined;
  }
  return client.stop();
}

function generateReportHtml(report: any): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>UPLim Engine Report</title>
      <style>
        body { font-family: system-ui; padding: 20px; }
        .metric { margin: 10px 0; }
        .good { color: green; }
        .warning { color: orange; }
        .error { color: red; }
      </style>
    </head>
    <body>
      <h1>UPLim Engine Report</h1>
      <pre>${JSON.stringify(report, null, 2)}</pre>
    </body>
    </html>
  `;
}
