var fs = require("fs");
var dircompare = require('dir-compare');
var createReleaseNote = function(config)
{
	var releaseNoteArr = [];
	var cnt = 0;
	var options = {compareSize: true};
	var path_new = config.createReleaseNote.folder_path+"/code/new";
	var path_old = config.createReleaseNote.folder_path+"/code/old";
	var states = {'equal' : '==', 'left' : '->', 'right' : '<-', 'distinct' : '<>'};
	
	releaseNoteArr[releaseNoteArr.length] = "patch_no:"+config.createReleaseNote.patch_no;
	releaseNoteArr[releaseNoteArr.length] = "codebase:"+config.createReleaseNote.codebase;
	releaseNoteArr[releaseNoteArr.length] = "prev_patch_no:"+config.createReleaseNote.prev_patch_no;
	releaseNoteArr[releaseNoteArr.length] = "release_date:"+config.createReleaseNote.release_date;
	releaseNoteArr[releaseNoteArr.length] = "released_by:"+config.createReleaseNote.released_by;
	releaseNoteArr[releaseNoteArr.length] = "isaddon:"+config.createReleaseNote.isaddon;
	releaseNoteArr[releaseNoteArr.length] = "parentaddon:"+config.createReleaseNote.parentaddon;
	releaseNoteArr[releaseNoteArr.length] = "dbchanges:"+config.createReleaseNote.dbchanges;
	
	var res = dircompare.compareSync(path_new, path_old, options);
	res.diffSet.forEach(function (entry) {
		var state = states[entry.state];
		var name = entry.name1 ? entry.name1 : '';
		var relativePath = entry.relativePath.split("\\").join("/")
		relativePath = relativePath.substr(1,relativePath.length)
		if(state == "<>" && entry.type1 == "file")
		{
			cnt++;
			console.log("["+name+"] Different Files...")
			releaseNoteArr[releaseNoteArr.length] = "object"+cnt+":file#"+name+"#"+relativePath+"#0.0.0.1#modify#comment."
		}
		else if(entry.type1 == "file")
		{
			console.log("["+name+"] ["+state+"] Files...")
		}
		if(state == "->" && entry.type1 == "file")
		{
			cnt++;
			console.log("["+name+"] New Files...")
			releaseNoteArr[releaseNoteArr.length] = "object"+cnt+":file#"+name+"#"+relativePath+"#0.0.0.1#add#comment."
		}
	});
	if(cnt > 0)
		releaseNoteArr[releaseNoteArr.length] = "codechanges:yes"
	else
		releaseNoteArr[releaseNoteArr.length] = "codechanges:no"
	releaseNoteArr[releaseNoteArr.length] = "total_no_objects:"+cnt;
	releaseNoteArr[releaseNoteArr.length] = "tir1:1#"+config.createReleaseNote.tir;
	releaseNoteArr[releaseNoteArr.length] = "total_no_tir:1"
	releaseNoteArr[releaseNoteArr.length] = "impact1:1#"+config.createReleaseNote.impact;
	releaseNoteArr[releaseNoteArr.length] = "total_no_impacts:1";
	releaseNoteArr[releaseNoteArr.length] = "comments:"+config.createReleaseNote.comments;
	releaseNoteArr[releaseNoteArr.length] = "authorised_by:"+config.createReleaseNote.authorised_by;
	releaseNoteArr[releaseNoteArr.length] = "qa_certified:"+config.createReleaseNote.qa_certified;
	releaseNoteArr = releaseNoteArr.join("\n");
	try{
		fs.writeFileSync(config.createReleaseNote.folder_path+'/ReleaseNote.txt', releaseNoteArr);
	}catch(e){
		return console.log("Error while creating release note file..."+e)
	}
	return console.log("Release Note Creation Done...")
}

module.exports = createReleaseNote;