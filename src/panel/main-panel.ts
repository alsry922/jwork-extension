import * as vscode from 'vscode';

export class MainPanel {
    private panel: vscode.WebviewPanel;

    constructor(
        private readonly context: vscode.ExtensionContext
    ) {
        this.panel = vscode.window.createWebviewPanel(
            'chatPanel',
            'Chat Panel',
            vscode.ViewColumn.Two,
            {
                enableScripts: true,
                retainContextWhenHidden: true
            }
        );

        this.panel.webview.html = MainPanel.getWebviewContent();
    }

    public static getWebviewContent(): string {
        return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Chat Panel</title>
                <style>
                    body {
                        padding: 20px;
                        color: var(--vscode-editor-foreground);
                        background: var(--vscode-editor-background);
                    }
                    .chat-container {
                        display: flex;
                        height: 100vh;
                    }
                    .sidebar {
                        width: 200px;
                        border-right: 1px solid var(--vscode-panel-border);
                        padding: 10px;
                    }
                    .chat-area {
                        flex: 1;
                        padding: 10px;
                    }
                    .new-chat-btn {
                        width: 100%;
                        padding: 8px;
                        background: var(--vscode-button-background);
                        color: var(--vscode-button-foreground);
                        border: none;
                        border-radius: 4px;
                        cursor: pointer;
                    }
                </style>
            </head>
            <body>
                <div class="chat-container">
                    <div class="sidebar">
                        <button class="new-chat-btn">New Chat</button>
                    </div>
                    <div class="chat-area">
                        <h2>Welcome to Chat Panel</h2>
                    </div>
                </div>
            </body>
            </html>
        `;
    }

    public static show(context: vscode.ExtensionContext) {
        new MainPanel(context);
    }
}