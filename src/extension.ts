import * as vscode from 'vscode';
import * as fs from 'fs';
import * as path from 'path';
import { MainPanel } from './panel/main-panel';

export function activate(context: vscode.ExtensionContext) {
	console.log('Extension is now active!');

	// Register the command to open chat panel
	context.subscriptions.push(
		vscode.commands.registerCommand('jwork-extension.openChat', () => {
			MainPanel.show(context);
		})
	);

	// Register view provider
	context.subscriptions.push(
		vscode.window.registerWebviewViewProvider('jwork-chat-panel', {
			resolveWebviewView(webviewView: vscode.WebviewView) {
				// When the icon is clicked, show the panel in the editor area
				MainPanel.show(context);
			}
		})
	);

	// Register existing commands
	context.subscriptions.push(vscode.commands.registerCommand('jwork-extension.generate.controller', generateController));
}

async function generateController(filePath: string, filename: string) {
	try {
		const rootPath = getWorkspaceRoot();
		if (!rootPath) return;

		const resultPath = await promptUserForPathAndName();
		if (!resultPath) return;
		const { filePath, filename } = resultPath;

		const fullPath = path.join(rootPath, filePath, `${filename}`);
		if (!validateAndPreparePath(fullPath)) return;

		const content = generateJavaTemplate(filePath, filename);
		fs.writeFileSync(fullPath, content);

		const doc = await vscode.workspace.openTextDocument(fullPath);
		await vscode.window.showTextDocument(doc);

		vscode.window.showInformationMessage(`파일이 생성되었습니다: ${fullPath}`);
	} catch (error) {
		vscode.window.showErrorMessage(`오류: ${error}`);
	}
}

function getWorkspaceRoot(): string | undefined {
	const folders = vscode.workspace.workspaceFolders;
	if (!folders) {
		vscode.window.showErrorMessage('프로젝트(폴더)를 먼저 열어주세요.');
		return;
	}
	return folders[0].uri.fsPath;
}

async function promptUserForPathAndName(): Promise<{ filePath: string, filename: string } | undefined> {
	const filePath = await vscode.window.showInputBox({ prompt: '생성할 경로 (예: src/controllers)' });
	if (filePath === undefined) {
		return;
	}

	const filename = await vscode.window.showInputBox({ prompt: '파일 이름' });
	if (filename === undefined) {
		return;
	}

	return { filePath, filename };
}

function validateAndPreparePath(fullPath: string): boolean {
	if (fs.existsSync(fullPath)) {
		vscode.window.showErrorMessage('이미 파일이 존재합니다.');
		return false;
	}
	const dir = path.dirname(fullPath);
	if (!fs.existsSync(dir)) {
		fs.mkdirSync(dir, { recursive: true });
	}
	return true;
}

function generateJavaTemplate(filePath: string, filename: string): string {
	const pkg = filePath.replace(/[\\/]/g, '.');
	return `package ${pkg};\n\npublic class ${filename} {\n\n}`;
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