var Converter = require("csvtojson").Converter
    fs = require("fs");
var Promise = require("promise");
//var csvWriter = require('csv-write-stream')

var pairedWithTopics = Array();
var registration_id = Array();

function Helper() {

}

Helper.prototype.readCsvFile = function(pathToCsv , callback) {
    
    console.log("reading file " + pathToCsv);

    var converter = new Converter({
        delimiter: ",",
    });

    converter.on("end_parsed" , function(jsonArray){
        console.log("reading of " + pathToCsv + " finished");
        callback( jsonArray );
    })

    fs.createReadStream(pathToCsv).pipe(converter);

}


Helper.prototype.pairTokenWithRegid = function(input , output , callback){

    console.log("pairing device tokens with registration ID");

    var elements = findElements(input , output);
    elements.then(data => {
        var pairedElements = pairDevices(data);
        pairedElements.then(newData => {
            //console.log(newData["registration_id"]);
            console.log("pairing devices finished");
            callback(newData["paired"] , newData["registration_id"]);
        })
        
    })
    elements.catch(error => { 
        console.log(error) 
    });

}

function pairDevices(paired){
    return new Promise(function(resolve , reject){
        var pairedArray = paired.map(function(obj){
            var len = obj.tags.length;
            for(var i = 0; i < len; i++){
                if(!Array.isArray(pairedWithTopics[obj.tags[i]])){
                    pairedWithTopics[obj.tags[i]] = [];
                }
                pairedWithTopics[obj.tags[i]].push(obj.registration_token);
            }
            registration_id.push(obj);
        })

        resolve(
            {
                paired : pairedWithTopics , 
                registration_id : registration_id
            }
            )
    })
}

function findElements(input , output){
    return new Promise(function(resolve , reject){
        console.log("matching apns token with registration ID");
        var len = input.length;
        var paired = [];
        for(var i = 0; i< len; i++){
            element = input[i]["Registration Id"];
            found = findElementParams(input , output, element , i);
            if(found != null){
                console.log(i + " device paired");
                paired.push(found);
            } else {
                reject("not paired");
            }
        } 
        resolve(paired);
    })
}

function findElementParams(in_csv, out_csv , element , input_position){

    console.log("finding element " + element);

    var len = out_csv.length;
    var found = {};

    for(var i = 0; i < len; i++){
        //console.log(out_csv[i]["apns_token"]);
        if(typeof out_csv[i]["apns_token"] != "undefined"){
            if(new String(out_csv[i]["apns_token"]).valueOf() == new String(element).valueOf()){
                found["registration_token"] = out_csv[i]["registration_token"];
                var tags = in_csv[input_position]["Tags"].split(";");
                found["tags"] = tags;
                return found;
            }
        } else {
            return null;
        }
    }

}



module.exports = Helper;