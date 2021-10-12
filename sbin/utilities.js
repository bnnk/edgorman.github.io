/* 
utilities.js 

@edgorman 09-10-21
*/

export function onCommandNotFound(terminal, command){
    terminal.echo("[[;red;]Error: Command not found '" + command + "']\n");
}

export function onExceptionThrown(terminal, exception){
    console.error("ERROR: " + exception);
    terminal.echo("[[;red;]Error: " + exception + "]\n");
}

export function generatePromptMessage(terminal, directory){
    if (String(directory).startsWith(terminal.user.homeDirectory)){
        directory = String(directory).replace(terminal.user.homeDirectory, "~");
    }

    document.title = directory;
    return "&#91;" + terminal.user.name + "@" + terminal.hostname + ":" + directory + "&#93;$ ";
}

export function generateGreetingMessage(terminal){
    return "Currently rebuilding so is WIP, check back in a couple of weeks! :)";
//  return `Copyright (c) 2021 Edward Gorman` 
//  + `\n<https://github.com/edgorman>`
//  + `\n\nWelcome to https://`
//  + terminal.hostname
//  + `\n`
//  + termina.commitMessage
//  + `\n\nYou are currently logged in as: [[b;;]` 
//  + termina.user.name
//  + `]\nTo start, enter the command "[[b;;]help]"`;
}

export function generateCommitMessage(commit){
    return "Last commit by " 
    + commit['author']
    + " on "
    + commit['date']
    + " ("
    + commit['id']
    + ")";
}

export function generateKeyMappings(){
    return { 
        'CTRL+R': function() { location.reload(); }
    }
}

export function loadFile(path){
    var result;

    $.ajax({
        url: path,
        cache: false,
        async: false,
        success:function(data) {
            result = data;
            console.info("INFO: Successfully loaded " + path + ".");
        }
        }).fail(function() {
            console.error("ERROR: Failed to retrieve " + path + ".");
            window.stop();
        }
    );
    
    return result;
}

export function loadFileSystem(fileSystemPath){
    return loadFile(fileSystemPath);
}

export function loadGitHistory(gitHistoryPath){
    return loadFile(gitHistoryPath);
}

function splitPath(path){
    if (String(path).startsWith("/"))
        path = path.substring(1, path.length);
    
    if (String(path).endsWith("/"))
        path = path.substring(0, path.length - 1);

    if (path == "") return [];
    else return String(path).split(/[\\/]/);
}

export function getAbsolutePath(fileSystem, absolutePath){
    // Assumes the absolute path must exist
    var path = fileSystem["/"];

    var pathSegments = splitPath(absolutePath);
    for (var i = 0; i < pathSegments.length; i++){
        path = path[pathSegments[i]];
    }

    return path;
}

export function getPath(fileSystem, currentDirectory, relativePath){
    // Navigate to current directory
    var path = getAbsolutePath(fileSystem, currentDirectory["_parent"] + currentDirectory["_name"]);

    // Navigate to relative path
    var pathSegments = splitPath(relativePath);
    for (var i = 0; i < pathSegments.length; i++){

        if (pathSegments[i] == "" || pathSegments[i] == "."){
            continue;
        }
        else if (pathSegments[i] == ".."){
            path = getAbsolutePath(fileSystem, path['_parent']);
        }
        else{
            if (pathSegments[i] in path){
                path = path[pathSegments[i]];
            }
            else{
                // Path does not exist
                return false;
            }
        }

    }

    // Path must exist
    return path;
}

export function onCompletion(terminal){
    var input = $.terminal.parse_command(terminal.terminal.before_cursor());
    var relativePath = "";

    // Navigate to current directory
    var path = getAbsolutePath(terminal.fileSystem, terminal.currentDirectory["_parent"] + terminal.currentDirectory["_name"]);

    // Navigate to relative path
    var pathSegments = splitPath(input.rest);
    for (var i = 0; i < pathSegments.length; i++){

        if (pathSegments[i] == "" || pathSegments[i] == "."){
            continue;
        }
        else if (pathSegments[i] == ".."){
            path = getAbsolutePath(terminal.fileSystem, path['_parent']);
            relativePath += "../"
        }
        else{
            if (pathSegments[i] in path){
                path = path[pathSegments[i]];
                relativePath += pathSegments[i] + "/";
            }
            else{
                break;
            }
        }

    }

    // Add files to list of possible autofills
    var autofills = [];
    for (var entry in path){

        if (String(entry).startsWith("_")){
            continue;
        }
        else if (pathSegments.length == 0){
            autofills.push(path[entry]["_name"]);
        }
        else{
            autofills.push(relativePath + path[entry]["_name"]);
        }

    }

    return autofills;
}