import * as vscode from 'vscode';
import nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import * as path from 'path';


dotenv.config({ path: path.resolve(__dirname, '../.env') });

console.log("SMTP_SERVER:", process.env.SENDER);



const SENDER = process.env.SENDER || '';
const SENDER_PASSWORD = process.env.SENDER_PASSWORD || '';
const SMTP_SERVER = process.env.SMTP_SERVER || '';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '', 10);
const SMTP_SECURE = process.env.SMTP_SECURE === 'true';

async function sendEmail(cellIndex: number, cellOutput: string) {

	const config = vscode.workspace.getConfiguration('ringMeJupyter');
	const recipientEmail = config.get<string>('recipientEmail', ''); //email from settings

	if (!recipientEmail) {
		vscode.window.showErrorMessage("Please set your email in VS Code settings (Ring Me Jupyter: Recipient Email).");
		return;
	}


	const transporter = nodemailer.createTransport({
		host: SMTP_SERVER,//example smtp.hostinger.com
		port: SMTP_PORT, //example 465
		secure: SMTP_SECURE, //SSL
		auth: {
			user: SENDER, //sender email
			pass: SENDER_PASSWORD //password
		}
	});

	const mailOptions = {
		from: SENDER, //sender email
		to: recipientEmail, //recipient
		subject: `Jupyter Cell ${cellIndex} Execution Complete`,
		html: `
			<h2>🔔 Jupyter Cell Execution Completed</h2>
			<p>The following cell has finished executing:</p>
			<p><strong>Cell Index:</strong> ${cellIndex}</p>
			<h3>📤 Output:</h3>
			<pre style="background-color: #f4f4f4; padding: 10px; border-radius: 5px;">
${cellOutput || "No output available"}
			</pre>
			<p> This message was sent automatically by <strong>Ring-Me-Jupyter</strong>.</p>
		`
	};

	try {
		await transporter.sendMail(mailOptions);
		console.log(`✅ Email sent successfully to ${recipientEmail}`);
	} catch (error) {
		console.error("❌ Failed to send email:", error);
	}
}



export function activate(context: vscode.ExtensionContext) {
    console.log('Extension Ring-Me-Jupyter activated!');
    vscode.window.showInformationMessage('Ring Me Jupyter is working!');

    //listens condition of cell
	vscode.workspace.onDidChangeNotebookDocument(e => {
		e.cellChanges.forEach(change => {
	  	if (change.executionSummary?.success !== undefined) {
			const cell = change.cell;
			if (cell.metadata?.notifyOnComplete) {	

				const outputText = cell.outputs?.map(output => {
					return output.items?.map(item => Buffer.from(item.data).toString('utf-8')).join('\n');//to string
				}).join('\n') || "No output available";


		  		vscode.window.showInformationMessage(`Cell ${cell.index} finished!`);
			  	sendEmail(cell.index, outputText); 
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