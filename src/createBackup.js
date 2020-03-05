var cmd = require('node-cmd');
var copydir = require('copy-dir');
var shell = require('shelljs');
var mail = require('./sendMail');
var logger = require('./logger');

var createBackupInit = function(config)
{
    var config = config;
    this.createBackup = function(done)
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
    this.createBackupDone = function(val)
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
    return {createBackup,createBackupDone};
}
module.exports = createBackupInit;