var cmd = require('node-cmd');
var copydir = require('copy-dir');
var fs = require('fs');

var destroy = require('./src/destroy');
var createTableSpace = require('./src/createTableSpace');
var mail = require('./src/sendMail');
var logger = require('./src/logger');
var createReleaseNote = require('./src/createReleaseNote');
var createBackup = require('./src/createBackup');
var createPatch = require('./src/createPatch');

var readConfigFile = function () {
    try {
        var dataBuffer = fs.readFileSync('./config/config.txt')
		var dataJSON = dataBuffer.toString()
        return JSON.parse(dataJSON)
    } catch (e) {
        return {}
    }
}
var config = readConfigFile();
console.log("Please select options from below list:");
console.log("1. Create Setup");
console.log("2. Create Patch");
console.log("3. Backup");
console.log("4. Release Note");
console.log("5. Test");

console.log("Please enter your choice (1 / 2 / 3 / 4 / 5) : ");
var user_input = process.stdin;
user_input.setEncoding('utf-8');
user_input.on('data',function(data){
	if(data == 1)
	{
		console.log("Create setup process started...");
		(async function(){
			var resp=await createTableSpace(config);
			console.log("resp : "+resp)
			if(resp.status == "unsuccess"){
				console.log("ERROR : "+resp.msg)
				process.exit();
			}
			else{
				console.log("Success : "+resp.msg)
				createSetup(createSetupDone);
			}
		})();
	}
	else if(data == 2)
	{
		console.log("Patch creation process started...");
		var createPatchObj = createPatch(config);
		createPatchObj.createPatch(createPatchObj.createPatchDone);
		//createPatch(createPatchDone)
	}
	else if(data == 3)
	{
		console.log("Backup process started...");
		var createBackupObj = createBackup(config);
		createBackupObj.createBackup(createBackupObj.createBackupDone);
	}
	else if(data == 4)
	{
		console.log("Release note creation started...");
		createReleaseNote(config);
		process.exit()
	}
	else if(data == 5)
	{
		console.log("Destroy process started...");
		var des = new destroy();
		des.destroyOne();
		logger.error("...Hello IB...");
		var mailObj = mail(config)
		mailObj.transporter.sendMail(mailObj.mailOptions, function(error, info){
			if (error) {
				console.log(error);
				process.exit()
			} else {
				console.log('Email sent: ' + info.response);
				process.exit()
			}
		});
	}
	else
	{
		console.log("Invalid Input!!!");
		process.exit();
	}
})

function createSetup(done)
{
	//Export DB 
	try{
		createTableSpace(config)
	}catch(e){
		console.log("Error in creating tablespace : "+e);
		done("Error while creating tablespace...");
	}
		
	cmd.get(config.createSetup.db_export_cmd,function(err, data, stderr){
		if(err){
			console.log('DB Export Error : ',err)
			done("Error while exporting database...");
		}
		cmd.get(config.createSetup.db_import_cmd,function(err, data, stderr){
			if(err){
				console.log('DB Import Error : ',err)
				done("Error while importing database...");
			}
			console.log('DB Import Output : ',data)
			done("Database Setup Done...");
		});
		cmd.run('touch example.created.file');
		console.log('DB Export Output : ',data)
	});
	cmd.run('touch example.created.file');

	//Copy WAR
	copydir(config.createSetup.war_from, config.createSetup.war_to, {
			utimes: true,  // keep add time and modify time
			mode: true,    // keep file mode
			cover: true    // cover file when exists, default is true
		}, function(err){
		if(err){
			console.log("Error : "+err)
			done("Error in copying WAR...");
		}
		else{
			console.log('File copied successfully...');
			done("WAR Setup Done...");
		} 
	});
}
var createSetupCnt = 0;
function createSetupDone(val)
{
	console.log(val)
	if(val == "Error while creating tablespace...")
	{
		process.exit()
	}
	createSetupCnt++
	if(createSetupCnt==1)
	{
		console.log("Process Complete")
		process.exit()
	}
}