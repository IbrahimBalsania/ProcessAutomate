var cmd = require('node-cmd');
var copydir = require('copy-dir');
var fs = require('fs');
var dircompare = require('dir-compare');
var shell = require('shelljs');
var format = require('util').format;

var destroy = require('./src/destroy');
var createTableSpace = require('./src/createTableSpace');
var mail = require('./src/sendMail');
var logger = require('./src/logger');
var createReleaseNote = require('./src/createReleaseNote');

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
		createPatch(createPatchDone)
	}
	else if(data == 3)
	{
		console.log("Backup process started...");
		createBackup(createBackupDone);
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
function createBackup(done)
{
	// totalBackupCnt = parseFloat(config.backupData.length);
	totalBackupCnt = parseFloat(config.backupData.length) * 2; 
	for(var i=0 ; i<config.backupData.length ; i++)
	{
		//Copy WAR
		shell.mkdir('-p', config.backupData[i].war_to);
		var bkName = config.backupData[i].backup_name;
		(function(i){
			copydir(config.backupData[i].war_from, config.backupData[i].war_to, {
				utimes: true,  // keep add time and modify time
				mode: true,    // keep file mode
				cover: true    // cover file when exists, default is true
			}, function(err,bkName){
				// console.log("###backup_name### 1 : "+bkName)
				if(err){
					console.log(config.backupData[i].backup_name+" : Error : "+err)
					logger.error(config.backupData[i].backup_name+" : Error in copying WAR...");
					logger.error(config.backupData[i].backup_name+" : ERROR : "+err);
					done(config.backupData[i].backup_name+" : Error in copying WAR...");
				}
				else{
					console.log(config.backupData[i].backup_name+' : WAR copy done...');
					logger.info(config.backupData[i].backup_name+' : WAR copy done...');
					done(config.backupData[i].backup_name+" : WAR copy done...");
				} 
			});
		})(i);
	}
	for(var j=0 ; j<config.backupData.length ; j++)
	{
		//Export DB 
		var bkName = config.backupData[j].backup_name;
		console.log("###backup_name### 2 OUT : "+bkName);
		(function(j){
			cmd.get(config.backupData[j].db_export_cmd,function(err, data, stderr){
				console.log("###backup_name### 2 : "+bkName)
				if(err){
					console.log(config.backupData[j].backup_name+' : DB Export Error : ',err)
					logger.error(config.backupData[j].backup_name+" : Error while exporting database...");
					logger.error(config.backupData[j].backup_name+' : DB Export Error : '+err);
					done(config.backupData[j].backup_name+" : Error while exporting database...");
				}
				console.log('Data : ',data)
				console.log(config.backupData[j].backup_name+' : DB Export Output : ',data)
				// logger.info(config.backupData[j].backup_name+' : DB Export Data : '+data);
				logger.info(config.backupData[j].backup_name+" : Database export done...");
				done(config.backupData[j].backup_name+" : Database export done...");
			});
			cmd.run('touch example.created.file');
		})(j);
	}
}
var createBackupCnt = 0;
var totalBackupCnt = 0;
function createBackupDone(val)
{
	console.log(val)
	createBackupCnt++
	if(createBackupCnt==totalBackupCnt)
	{
		console.log("Backup Process Complete")
		var mailObj = mail(config);
		mailObj.transporter.sendMail(mailObj.mailOptions, function(error, info){
			if (error) {
				console.log(error);
				process.exit();
			} else {
				console.log('Email sent: ' + info.response);
				process.exit();
			}
		});
	}
}
function createPatch(done)
{
	var options = {compareSize: true};
	var path_dev = config.createPatch.dev_src;
	var path_uat = config.createPatch.uat_src;
	
	var states = {'equal' : '==', 'left' : '->', 'right' : '<-', 'distinct' : '<>'};
	
	var res = dircompare.compareSync(path_dev, path_uat, options);
	// console.log(format('equal: %s, distinct: %s, left: %s, right: %s, differences: %s, same: %s',res.equal, res.distinct, res.left, res.right, res.differences, res.same));
	res.diffSet.forEach(function (entry) {
		// console.log("entry : "+JSON.stringify(entry))
		var state = states[entry.state];
		var name1 = entry.name1 ? entry.name1 : '';
		var fullname1 = entry.name1 ? entry.path1+"/"+entry.name1 : ''; // create array and copy file to new folder
		var name2 = entry.name2 ? entry.name2 : '';
		var fullname2 = entry.name2 ? entry.path2+"/"+entry.name1 : ''; // create array and copy file to old folder
		fullname1 = fullname1.split("\\").join("/")
		fullname2 = fullname2.split("\\").join("/")
		var relativePath = entry.relativePath.split("\\").join("/")
		
		var patchNewFolder = "/code/new/"
		var patchOldFolder = "/code/old/"
		if(state == "<>" && entry.type1 == "file")
		{
			var vFileExt = name1.split(".")
			if(config.createPatch.ignore_file_extension.indexOf(vFileExt[vFileExt.length-1].toLowerCase()) == -1)
			{
				console.log("["+name1+"] Different Files...")
				// File modified
				shell.mkdir('-p', config.createPatch.patch_path+patchNewFolder+relativePath);
				shell.mkdir('-p', config.createPatch.patch_path+patchOldFolder+relativePath);
				copydir.sync(fullname1, config.createPatch.patch_path+patchNewFolder+relativePath+"/"+name1, {utimes: true,mode: true,cover: true});
				copydir.sync(fullname2, config.createPatch.patch_path+patchOldFolder+relativePath+"/"+name2, {utimes: true,mode: true,cover: true});
			}
		}
		if(state == "->" && entry.type1 == "file")
		{
			var vFileExt = name1.split(".")
			if(config.createPatch.ignore_file_extension.indexOf(vFileExt[vFileExt.length-1].toLowerCase()) == -1)
			{
				console.log("["+name1+"] New Files...")
				// New file added
				shell.mkdir('-p', config.createPatch.patch_path+patchNewFolder+relativePath);
				copydir.sync(fullname1, config.createPatch.patch_path+patchNewFolder+relativePath+"/"+name1, {utimes: true,mode: true,cover: true});
			}
		}
	});
	createReleaseNote(config)
	done("Patch Creation Done...")	
}
function createPatchDone(val)
{
	console.log(val)
	process.exit()
}