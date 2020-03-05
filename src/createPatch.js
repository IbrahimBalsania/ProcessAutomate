var copydir = require('copy-dir');
var dircompare = require('dir-compare');
var shell = require('shelljs');
var createReleaseNote = require('./createReleaseNote');

var createPatchInit = function(config)
{
    var config = config;
    this.createPatch = function(done)
    {
        var options = {compareSize: true};
        var path_dev = config.createPatch.dev_src;
        var path_uat = config.createPatch.uat_src;
        
        var states = {'equal' : '==', 'left' : '->', 'right' : '<-', 'distinct' : '<>'};
        
        var res = dircompare.compareSync(path_dev, path_uat, options);
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
    this.createPatchDone = function(val)
    {
        console.log(val)
        process.exit()
    }
    return {createPatch,createPatchDone}
}

module.exports = createPatchInit;