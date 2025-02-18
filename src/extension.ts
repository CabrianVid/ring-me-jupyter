import * as vscode from 'vscode';
import nodemailer from 'nodemailer';



const RECIPIENT_EMAIL = "";


async function sendEmail(cellIndex: number) {
	const transporter = nodemailer.createTransport({
		host: 'smtp.hostinger.com',
		port: 465,
		secure: true, //SSL
		auth: {
			user: '', //sender email
			pass: '' //password
		}
	});

	const mailOptions = {
		from: '', //sender email
		to: RECIPIENT_EMAIL, //recipient
		subject: `Jupyter Cell ${cellIndex} Execution Complete`,
		text: `The cell at index ${cellIndex} has finished execution.`
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log(`✅ Email sent successfully to ${RECIPIENT_EMAIL}`);
	} catch (error) {
		console.error("❌ Failed to send email:", error);
	}
}



export function activate(context: vscode.ExtensionContext) {
    console.log('TEST: Extension activated!');
    vscode.window.showInformationMessage('Ring Me Jupyter is working!');

	let disposable = vscode.commands.registerCommand('extension.sendTestEmail', sendEmail);
	context.subscriptions.push(disposable);


    //listens condition of cell
	vscode.workspace.onDidChangeNotebookDocument(e => {
		e.cellChanges.forEach(change => {
	  	if (change.executionSummary?.success !== undefined) {
			const cell = change.cell;
			if (cell.metadata?.notifyOnComplete) {
		  		vscode.window.showInformationMessage(`Cell ${cell.index} finished!`);
			  	sendEmail(cell.index); 
			}
	  	}
		});
  	});

	
	
	context.subscriptions.push(
        vscode.notebooks.registerNotebookCellStatusBarItemProvider(
            "jupyter-notebook", //only for jupyter notebooks type file
            new BellStatusBarItemProvider()
        )
    );


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
			
			//updateBellIcon(cell, cellBells);
		})
	);
}


class BellStatusBarItemProvider implements vscode.NotebookCellStatusBarItemProvider {
    provideCellStatusBarItems(cell: vscode.NotebookCell): vscode.NotebookCellStatusBarItem[] {
        //current state of the notification
        const isEnabled = cell.metadata?.notifyOnComplete ?? false;

        const bellItem = new vscode.NotebookCellStatusBarItem(
            isEnabled ? "🔔 Notify On" : "🔕 Notify Off",
            vscode.NotebookCellStatusBarAlignment.Right
        );
        bellItem.tooltip = "Toggle execution notification";
		bellItem.command = {
			command: "ringMeJupyter.toggleBell",
			title: "Toggle Notification",
			arguments: [cell]
		};
		
        return [bellItem];
    }
}


export function deactivate() {}