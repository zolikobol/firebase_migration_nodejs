var Converter = require("csvtojson").Converter
    fs = require("fs");

var pairedWithTopics = Array();
var registration_id = Array();

function Helper() {

}

Helper.prototype.readCsvFile = function(pathToCsv , callback) {

    var converter = new Converter({
        delimiter: ",",
    });

    converter.on("end_parsed" , function(jsonArray){
        callback( jsonArray );
    })

    fs.createReadStream(pathToCsv).pipe(converter);

}


Helper.prototype.pairTokenWithRegid = function(input , output , callback){

    console.log("pairing device tokens with registration ID");
    console.log("getting tags for registration ID");

    var len = input.length;

    var paired = [];

    console.log(len);

    for(var i = 0; i< len; i++){
        element = input[i]["reg_id"];
        found = this.findElementParams(input , output, element , i);
        if(found != null){
            paired.push(found);
        }
    }

    var pairedArray = paired.map(function(obj){
        var len = obj.tags.length;
        for(var i = 0; i < len; i++){
            if(!Array.isArray(pairedWithTopics[obj.tags[i]])){
                pairedWithTopics[obj.tags[i]] = [];
            }
            pairedWithTopics[obj.tags[i]].push(obj.registration_token);
            registration_id.push(obj.registration_token);
        }
    })

    callback(pairedWithTopics , registration_id);

}

Helper.prototype.findElementParams = function(in_csv, out_csv , element , input_position){

    var len = out_csv.length;
    var found = {};

    //console.log(element);

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