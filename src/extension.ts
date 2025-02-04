import * as vscode from 'vscode';

export function activate(context: vscode.ExtensionContext) {
    console.log('TEST: Extension activated!');
    vscode.window.showInformationMessage('Ring Me Jupyter is working!');

    const cellBells = new Map<vscode.NotebookCell, vscode.StatusBarItem>();

    // Handle notebook opening and existing notebooks
    vscode.workspace.onDidOpenNotebookDocument(notebook => {
        notebook.getCells().forEach(cell => addBellToCell(cell, cellBells));
    });

    // Handle cell changes through document changes
    vscode.workspace.onDidChangeNotebookDocument(e => {
        // Handle added cells
        e.contentChanges.forEach(change => {
            change.addedCells.forEach(cell => addBellToCell(cell, cellBells));
        });

        // Handle removed cells
        e.contentChanges.forEach(change => {
            change.removedCells.forEach(cell => {
                cellBells.get(cell)?.dispose();
                cellBells.delete(cell);
            });
        });
    });

    // Track cell execution completion
	vscode.workspace.onDidChangeNotebookDocument(e => {
		e.cellChanges.forEach(change => {
	  	if (change.executionSummary?.success !== undefined) {
			const cell = change.cell;
			if (cell.metadata?.notifyOnComplete) {
		  	vscode.window.showInformationMessage(`Cell ${cell.index} finished!`);
			}
	  	}
		});
  	});

    // Command registration
	context.subscriptions.push(
		vscode.commands.registerCommand('ringMeJupyter.toggleBell', async (cell: vscode.NotebookCell) => {
			const newMetadata = {
				...cell.metadata,
				notifyOnComplete: !cell.metadata?.notifyOnComplete
			};
			
			const edit = new vscode.WorkspaceEdit();
			edit.set(cell.notebook.uri, [
				vscode.NotebookEdit.updateCellMetadata(cell.index, newMetadata)
			]);
			await vscode.workspace.applyEdit(edit);
			
			
			
			updateBellIcon(cell, cellBells);
		})
	);
}

function addBellToCell(
    cell: vscode.NotebookCell,
    bellMap: Map<vscode.NotebookCell, vscode.StatusBarItem>
) {
    const bell = vscode.window.createStatusBarItem(vscode.StatusBarAlignment.Left);
    bell.text = cell.metadata?.notifyOnComplete ? "🔔" : "🔕";
    bell.tooltip = "Click to toggle execution notifications";
    bell.command = {
        command: 'ringMeJupyter.toggleBell',
        title: 'Toggle Notification',
        arguments: [cell]
    };
    bell.show();
    bellMap.set(cell, bell);
}

function updateBellIcon(
    cell: vscode.NotebookCell,
    bellMap: Map<vscode.NotebookCell, vscode.StatusBarItem>
) {
    const bell = bellMap.get(cell);
    if (bell) {
        bell.text = cell.metadata?.notifyOnComplete ? "🔔" : "🔕";
    }
}

export function deactivate() {}