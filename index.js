var https = require("https");
var request = require('request');
var Helper = require("./helper.js");
var Promise = require("promise");

var helper = new Helper();

var json1, json2;

var inCsv = new Promise((resolve , reject) => {
    helper.readCsvFile("./csv/com.economist.ipad.in.csv" , function(csvContent){  
        resolve(csvContent);
    })
});

var outCsv =  new Promise((resolve , reject) => {
    helper.readCsvFile("./csv/com.economist.ipad.in_out.csv" , function(csvContent){
        resolve(csvContent);
    })
})

/*Promise.all([inCsv, outCsv]).then(values => { 
    json1 = values[0];
    json2 = values[1];
    console.log("input and output files read");
    helper.pairTokenWithRegid(json1 , json2 , function(result , regID){
        console.log("paired");
        unsubscribeFromTopic(regID , function(result){
            console.log(result);
        });
  })
});*/

function unsubscribeFromTopic(regID , func){

    console.log("unsubscribeTopic");

    var result = regID.map(function(obj){

        return new Promise((resolve) => {
      
        var options = {
            host: "iid.googleapis.com",
            path: "/iid/info/" + obj.registration_token + "?details=true",
            method: 'GET',
            headers: {Authorization : "key=AIzaSyA18DOy5YTyPoUFK8x6hASacSL3xH68upc"}
        }

        callback = function(response) {

            var str = '';

            response.on('data' , function (chunk){
                str += chunk;
            });

            response.on('end' , function (){
                //console.log(str);
                    str = JSON.parse(str);
                    if(typeof str["rel"] != "undefined"){
                        var keys = Object.keys(str["rel"]["topics"]);
                        var oldTopics = getOldTopics(keys);
                        str["rel"]["topics"] = oldTopics;
                        keys = str["rel"]["topics"];
                        var len = keys.length;
                        //console.log(keys[0]);
                        for(var i = 0; i < len; i++){
                            //console.log(obj.registration_token + ' - ' + keys[i]);
                            //unsubscribe(obj.registration_token , keys[i]);
                        }
                        /*console.log({ 
                            registration_token : obj.registration_token,
                            topics : keys
                            });*/
                            resolve({ 
                            registration_token : obj.registration_token,
                            topics : keys
                            });
                        /*return { 
                            registration_token : obj.registration_token,
                            topics : keys
                            }*/
                    }
                    //console.log();
                    //var newTopics = Object.keys(str["rel"]["topics"]);
                    //console.log(key);
                    /*var len = key.length;
                    for(var i = 0; i < len; i++){
                        console.log(regID + ' - ' + keys[i]);
                        //unsubscribe(regID , keys[i]);
                    }*/
            });
        }
        https.request(options , callback).end();

        });
    });

    Promise.all(result).then(() => func(result));

}

function unsubscribe(regID , topic){

    var options = {
        uri: 'https://iid.googleapis.com/iid/v1:batchRemove',
        method: 'POST',
        headers: {
            'Authorization' : "key=AIzaSyA18DOy5YTyPoUFK8x6hASacSL3xH68upc",
    
        },
        json: {
            "to": "/topics/" + topic,
            "registration_tokens": [regID]
        }
    };

    console.log(regID , topic);

    request(options, function (error, response, body) {

        console.log(error);
        if (!error && response.statusCode == 200) {
            console.log(body) // Print the shortened url.
        }
    });

    /*

    var content = {
        to: "/topics/" + topic,
        registration_tokens: [regID]
    }

    content = JSON.stringify(content);

    //console.log(content);

    var options = {
        host: "iid.googleapis.com",
        path: "/iid/v1:batchRemove",
        method: 'POST',
        headers: {
            'Authorization' : "key=AIzaSyA18DOy5YTyPoUFK8x6hASacSL3xH68upc",
            'Content-Type' : "application/json",
            'Content-Length': content.length
    
        }
    }

    console.log('before callback')
    var req = https.request(options , function(response) {

        console.log('in callback');

        var str = '';

        response.on('data' , function (chunk){
            str += chunk;
            console.log(str);
        });

        response.on('end' , function (){
            req.end();
        });

        response.on('error' , function (error){
            console.log("error");
        });
    });

    console.log('after callback')

    req.write(content);*/
    //req.end();
}

function getOldTopics(topics){

    var topicsMap = {
        Platform_iOS : "Platform_iOS",
        Device_Type_iPad : "Device_Type_iPad",
        Paid_User : "Paid_User",
        Free_User : "Free_User",
        LoggedIn_Yes : "LoggedIn_Yes",
        LoggedIn_No : "LoggedIn_No"

    }

    return topics.filter(function(obj) {
        if(typeof topicsMap[obj] !== 'undefined'){
            return topicsMap[obj];
        }
    })
}