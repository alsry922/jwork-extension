import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';

class ChatRoom extends vscode.TreeItem {
	constructor(
		public readonly id: string,
		public readonly label: string,
		public readonly collapsibleState: vscode.TreeItemCollapsibleState
	) {
		super(label, collapsibleState);
		this.tooltip = label; // tree view에 마우스 올리면 표시되는 툴팁
		this.description = 'Chat Room'; // tree view에 표시되는 설명
		this.iconPath = new vscode.ThemeIcon('comment-discussion'); // tree view에 표시되는 아이콘
		this.command = {
			command: 'jwork-extension.openChatRoom',
			title: 'Open Chat Room',
			arguments: [this]
		};
	}
}

class ChatRoomProvider implements vscode.TreeDataProvider<ChatRoom> {
	private static readonly viewType = 'jwork-extension.chatPanel';  // 고유한 ID

	// vscode.EventEmitter: 이벤트를 생성하고 관리하는 클래스
	//  여러 구독자가 하나의 이벤트를 구독할 수 있음.
	//  이벤트 발생 시 모든 구독자에게 동기적으로 알림을 보냄
	//  구독자는 EventEmitter의 event 속성을 통해 이벤트를 구독함.
	private _onDidChangeTreeData: vscode.EventEmitter<ChatRoom | undefined | null | void> = new vscode.EventEmitter<ChatRoom | undefined | null | void>(); // EventEmitter 인스턴스 생성
	readonly onDidChangeTreeData: vscode.Event<ChatRoom | undefined | null | void> = this._onDidChangeTreeData.event; // EventEmitter의 event 속성을 통해 이벤트를 구독함.

	private chatRooms: ChatRoom[] = [];
	private currentPanel: vscode.WebviewPanel | undefined;

	constructor(private context: vscode.ExtensionContext) {}

	refresh(): void {
		// 이벤트를 발생시킴
		// 해당 이벤트를 구독하고 있는 모든 리스너가 실행됨.
		this._onDidChangeTreeData.fire();
	}

	// tree view에 표시될 아이템을 반환함.
	getTreeItem(element: ChatRoom): vscode.TreeItem {
		return element;
	}

	// tree view에 표시될 아이템의 자식 아이템을 반환함.
	getChildren(element?: ChatRoom): Thenable<ChatRoom[]> {
		return Promise.resolve(this.chatRooms);
	}

	addChatRoom(): void {
		const id = Date.now().toString();
		const label = `Chat Room ${this.chatRooms.length + 1}`;
		const chatRoom = new ChatRoom(id, label, vscode.TreeItemCollapsibleState.None);
		this.chatRooms.push(chatRoom);
		this.refresh();
	}

	openChatRoom(chatRoom: ChatRoom): void {
		if (!this.currentPanel) {
			this.currentPanel = vscode.window.createWebviewPanel(
				'jwork-extension.chatPanel',
				chatRoom.label,
				vscode.ViewColumn.One,
				{
					enableScripts: true,
					retainContextWhenHidden: true
				}
			);

			this.currentPanel.onDidDispose(() => {
				this.currentPanel = undefined;
			}, null, this.context.subscriptions);

			this.currentPanel.webview.onDidReceiveMessage(async (message) => {
				if (message.type === 'fileAction') {
					const { action, fileType, fileName, filePath } = message;
					const fullPath = path.join(filePath, fileName);
					try {
						if (action === 'generate') {
							// 템플릿은 나중에 추가할 수 있도록 구조화
							let content = '';
							// 추후: if (fileType === 'controller') { content = ... }
							fs.mkdirSync(filePath, { recursive: true });
							fs.writeFileSync(fullPath, content, 'utf8');
							this.currentPanel?.webview.postMessage({ type: 'result', success: true, message: `파일 생성: ${fullPath}` });
						} else if (action === 'delete') {
							if (fs.existsSync(fullPath)) {
								fs.unlinkSync(fullPath);
								this.currentPanel?.webview.postMessage({ type: 'result', success: true, message: `파일 삭제: ${fullPath}` });
							} else {
								this.currentPanel?.webview.postMessage({ type: 'result', success: false, message: `파일이 존재하지 않습니다: ${fullPath}` });
							}
						}
					} catch (err: any) {
						this.currentPanel?.webview.postMessage({ type: 'result', success: false, message: `오류: ${err.message}` });
					}
				}
			});
		}
		this.currentPanel.title = chatRoom.label;
		this.currentPanel.webview.html = this.getWebviewContent(chatRoom);
		this.currentPanel.reveal();
	}

	private getWebviewContent(chatRoom: ChatRoom): string {
		return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${chatRoom.label}</title>
    <style>
        body {
            padding: 20px;
            color: var(--vscode-editor-foreground);
            background: var(--vscode-editor-background);
        }
        .chat-container {
            display: flex;
            flex-direction: column;
            height: 100vh;
        }
        .select-row {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        .input-row {
            display: flex;
            gap: 10px;
            margin-bottom: 10px;
        }
        .messages {
            flex: 1;
            overflow-y: auto;
            margin-bottom: 20px;
        }
        .message {
            margin: 10px 0;
            padding: 10px;
            border-radius: 4px;
        }
        .message.user {
            background: var(--vscode-editor-inactiveSelectionBackground);
        }
        .message.assistant {
            background: var(--vscode-editor-selectionBackground);
        }
        .input-area {
            display: flex;
            gap: 10px;
        }
        .message-input {
            flex: 1;
            padding: 8px;
            border: 1px solid var(--vscode-input-border);
            background: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border-radius: 4px;
        }
        .send-btn {
            padding: 8px 16px;
            background: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            border-radius: 4px;
            cursor: pointer;
        }
        .input-label {
            align-self: center;
            font-size: 0.9em;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="chat-container">
        <div class="select-row">
            <select id="actionSelect">
                <option value="generate">generate</option>
                <option value="delete">delete</option>
            </select>
            <select id="typeSelect">
                <option value="controller">controller</option>
                <option value="service">service</option>
                <option value="mapper">mapper</option>
            </select>
        </div>
        <div class="input-row">
            <input type="text" id="fileNameInput" class="message-input" placeholder="파일 이름 (예: MyController.ts)">
            <input type="text" id="filePathInput" class="message-input" placeholder="생성 경로 (예: src/controllers)">
        </div>
        <div class="messages" id="messages">
            <div class="message assistant">Hello! How can I help you today?</div>
        </div>
        <div class="input-area">
            <input type="text" class="message-input" id="messageInput" placeholder="Type your message...">
            <button class="send-btn" onclick="sendMessage()">Send</button>
        </div>
    </div>
    <script>
        function sendMessage() {
            const input = document.getElementById('messageInput');
            const content = input.value.trim();
            const action = document.getElementById('actionSelect').value;
            const fileType = document.getElementById('typeSelect').value;
            const fileName = document.getElementById('fileNameInput').value.trim();
            const filePath = document.getElementById('filePathInput').value.trim();
            if (content && fileName && filePath) {
                const messages = document.getElementById('messages');
                messages.innerHTML += '<div class="message user"><b>[' + action + ' ' + fileType + ']</b> ' + filePath + '/' + fileName + '<br>' + content + '</div>';
                window.scrollTo(0, document.body.scrollHeight);
                input.value = '';
                window.vscodeApi.postMessage({
                    type: 'fileAction',
                    action,
                    fileType,
                    fileName,
                    filePath
                });
            }
        }

        window.vscodeApi = acquireVsCodeApi();

        document.getElementById('messageInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                sendMessage();
            }
        });

        window.addEventListener('message', (event) => {
            const msg = event.data;
            if (msg.type === 'result') {
                const messages = document.getElementById('messages');
                messages.innerHTML += '<div class="message assistant">' + msg.message + '</div>';
                window.scrollTo(0, document.body.scrollHeight);
            }
        });
    </script>
</body>
</html>`;
	}
}

export function activate(context: vscode.ExtensionContext) {
	const chatRoomProvider = new ChatRoomProvider(context);

	// Register tree data provider
	context.subscriptions.push(
		vscode.window.registerTreeDataProvider('jwork-extension-sidebar', chatRoomProvider)
	);

	// Register command to add new chat room
	context.subscriptions.push(
		vscode.commands.registerCommand('jwork-extension.newChat', () => {
			chatRoomProvider.addChatRoom();
		})
	);

	// Register command to open chat room
	context.subscriptions.push(
		vscode.commands.registerCommand('jwork-extension.openChatRoom', (chatRoom: ChatRoom) => {
			chatRoomProvider.openChatRoom(chatRoom);
		})
	);
}

// This method is called when your extension is deactivated
export function deactivate() {}