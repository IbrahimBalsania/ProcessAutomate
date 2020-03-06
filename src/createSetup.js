var cmd = require('node-cmd');
var copydir = require('copy-dir');

var createSetupInit = function(config)
{
    var config = config;
    this.createSetup = function(done)
    {   
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
    this.createSetupDone = function(val)
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
    return {createSetup,createSetupDone}
}
module.exports = createSetupInit;