var Helper = require("./helper.js");
var Promise = require("promise");
var asynch = require("asynch");
var rp = require('request-promise');

var parameters = process.argv.slice(2);

var key = parameters[0];
var inCsv = parameters[1];
var outCsv = parameters[2];

var helper = new Helper();

//AIzaSyA18DOy5YTyPoUFK8x6hASacSL3xH68upc

var json1, json2;

var inCsv = new Promise((resolve , reject) => {
    helper.readCsvFile("./csv/" + inCsv , function(csvContent){  
        resolve(csvContent);
    })
});

var outCsv =  new Promise((resolve , reject) => {
    helper.readCsvFile("./csv/" + outCsv , function(csvContent){
        resolve(csvContent);
    })
})

Promise.all([inCsv, outCsv]).then(values => { 
    json1 = values[0];
    json2 = values[1];
    helper.pairTokenWithRegid(json1 , json2 , function(result , regID){
        //unsubscribeFromTopic(regID);
        subscribeToTopic(result);
  })
});

function subscribeToTopic(data){
    Object.keys(data).map(function(key, index) {
        subscribe(key , data[key] , topic => {
            if(topic != null){
                console.log('devices to topic ' + topic + ' were subscribed')
            }
        })
    });
}

function subscribe(topic , data , callback ){

    chunk = Array('aa');
    i = 0;
    while(chunk.length > 0){
        chunk = data.slice(i , i+98);
        console.log(i);
        var options = {
            uri: 'https://iid.googleapis.com/iid/v1:batchAdd',
            method: 'POST',
            headers: {
                'Authorization' : "key=" + key,
        
            },
            body: {
                "to": "/topics/" + topic,
                "registration_tokens": chunk
            },
            json: true,
        };

        i = i+98;

        rp(options)
            .then(function(res){
                delete chunk;
                delete len;
                console.log(res);
                console.log("=============================================");
                callback(topic);
            }).catch(function(err){
                delete chunk;
                delete len;
                console.log(err)
            })

    }
    
}

function unsubscribeFromTopic(regID){

    console.log("unsubscribeTopic");

    var devicesCount = 0;

    var devices = Array();

    var arrayLength = regID.length;

    var unsubscribeDevices = Promise.all(regID.map(function(item){
       
        return new Promise(function(resolve , reject){
            var options = {
                url: "https://iid.googleapis.com//iid/info/" + item.registration_token + "?details=true",
                method: 'GET',
                headers: {
                    'Authorization' : 'key=' + key,
                },
            };
            var request = require('request');
            
            try{
                request( options , function(error, response, body){
                    devicesCount++;
                    console.log(devicesCount + ' - ' + arrayLength);
                    if(!error && response.statusCode == 200){
                        if(body.indexOf("<HTML>") === -1){
                            res = JSON.parse(body);
                            if(typeof res["rel"] != "undefined"){
                                var keys = Object.keys(res["rel"]["topics"]);
                                var oldTopics = getOldTopics(keys);
                                res["rel"]["topics"] = oldTopics;
                                keys = res["rel"]["topics"];
                                var len = keys.length;
                                
                                if(len > 0){
                                    for(var i = 0; i< len; i++){
                                        if(typeof keys[i] != "undefined" ){
                                            if(!Array.isArray(devices[keys[i]])){
                                                devices[keys[i]] = [];
                                            }
                                            //console.log(devicesCount);
                                            devices[keys[i]].push(item.registration_token);
                                            if(arrayLength == devicesCount){
                                                //console.log('last');
                                                reject(devices);
                                            }  
                                            //resolve(item.registration_token);
                                            //console.log(devices);
                                            //unsubscribe(item.registration_token , keys[i]);
                                        }
                                    }
                                } else {
                                    //reject(false);
                                    console.log('no');
                                }
                            }
                        }
                    } else {
                        console.log(body);
                    }
                })
            } catch(err){
                console.log(err)
            }
        })          
    })).then(function(result){
        console.log('bbaa');
        //console.log(devices);
    }).catch(function(err){
        Object.keys(err).map(function(key, index) {
            unsubscribe(key , err[key] , topic => {
                if(topic != null){
                    console.log('devices to topic ' + topic + ' were unsubscribed');
                }
            })
        });
    })
}

function unsubscribe(topic , data , callback ){
    console.log(topic , data);
    chunk = Array('aa');
    i = 0;
    while(chunk.length > 0){
        chunk = data.slice(i , i+98);
        console.log(i);
        var options = {
            uri: 'https://iid.googleapis.com/iid/v1:batchRemove',
            method: 'POST',
            headers: {
                'Authorization' : "key=" + key,
        
            },
            body: {
                "to": "/topics/" + topic,
                "registration_tokens": chunk
            },
            json: true,
        };

        i = i+98;

        rp(options)
            .then(function(res){
                delete chunk;
                delete len;
                console.log(res);
                console.log("=============================================");
                callback(topic);
            }).catch(function(err){
                delete chunk;
                delete len;
                console.log(err)
            })
    }
}

/*function unsubscribe(regID , topic){
    
    var requestBody = {
            to: "/topics/" + topic,
            registration_tokens: [regID]
        }
    var options = {
        url: 'https://iid.googleapis.com/iid/v1:batchRemove',
        method: 'POST',
        json: true,
        headers: {
            'Authorization' : 'key=' + key,
        },
        body: requestBody

    };
    //console.log(topic)
    var request = require('request');

    try{
        request( options , function(error, response, body){
            console.log(body);
        })
    } catch(err){
        console.log(err)
    }
}*/

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