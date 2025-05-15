// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';
import fs from 'fs';

// This method is called when your extension is activated
// Your extension is activated the very first time the command is executed
export function activate(context: vscode.ExtensionContext) {
	// const CancellationTokenSource = new vscode.CancellationTokenSource();

	vscode.commands.registerCommand('jwork-extension.generate.controller', async () => {
		const filename = await vscode.window.showInputBox({title: '파일 이름', placeHolder: '파일 이름을 입력하세요', prompt: '파일 이름을 입력하세요'});
		if (!filename) {
			return;
		}
		const path = await vscode.window.showInputBox({title: '파일 경로', placeHolder: '파일 경로를 입력하세요', prompt: '파일 경로를 입력하세요', value: 'src/main/java/com/example/controller'});
		if (!path) {
			return;
		}
		!fs.existsSync(path) && fs.statSync(path).isFile()
	});
}

// This method is called when your extension is deactivated
export function deactivate() {}

interface BaseGenerator {
	generate(name: string): void
}

class ControllerGenerator implements BaseGenerator {
	generate(name: string): void {
		throw new Error('Method not implemented.');
	}
	
}