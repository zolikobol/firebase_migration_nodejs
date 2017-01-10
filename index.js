var https = require("https");
var request = require('request');
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
    console.log("input and output files read");
    helper.pairTokenWithRegid(json1 , json2 , function(result , regID){
        //var unsubscribed = unsubscribeFromTopic(regID);
        //console.log(typeof result)
        //console.log(typeof regID)
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

    
    /*var result = Promise.all(data.map(function(items){
        return new Promise(function(resolve, reject){
            resolve(items);
        })
    })).then(function(res){
        console.log(res);
    }).catch(function(err){
        console.log(err)
    })*/

}

function subscribe(topic , data , callback ){
    
    while(data.length > 0){
        chunk = data.slice(0 , 98);
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

        console.log(options);

        /*rp(options)
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
            })*/

    }
    
}

function unsubscribeFromTopic(regID){

    console.log("unsubscribeTopic");

    var devicesCount = 0;

    var result = Promise.all(regID.map(function(item){
        return new Promise(function(resolve,reject){
            var options = {
                uri: "https://iid.googleapis.com//iid/info/" + item.registration_token + "?details=true",
                method: 'GET',
                headers: {Authorization : "key=" + key}
            }

            rp(options)
                .then(function(res){
                    if(res.indexOf("<HTML>") === -1){
                        res = JSON.parse(res);
                        if(typeof res["rel"] != "undefined"){
                            var keys = Object.keys(res["rel"]["topics"]);
                            var oldTopics = getOldTopics(keys);
                            res["rel"]["topics"] = oldTopics;
                            keys = res["rel"]["topics"];
                            var len = keys.length;
                            //console.log(keys);
                            
                            console.log(item.registration_token , keys)
                            for(var i = 0; i< len; i++){
                                unsubscribe(item.registration_token , keys[i]);
                            }
                            resolve({
                                reg_token: item.registration_token,
                                tags: keys
                            });
                        }
                    }

                })
                .catch(function(err){
                    reject(err)
                })
        });
        
    })).then(values => {
        console.log(values);
    })

    result.then(function(data){
        //console.log(data);
    })
}

function unsubscribe(regID , topic){

    //console.log(regID , topic);

    var options = {
        uri: 'https://iid.googleapis.com/iid/v1:batchRemove',
        method: 'POST',
        headers: {
            'Authorization' : "key=" + key,
    
        },
        body: {
            "to": "/topics/" + topic,
            "registration_tokens": [regID]
        },
        json: true,
    };

    rp(options)
        .then(function(res){
            console.log(regID + " - ");
            console.log(res);
            console.log("====================");
        }).catch(function(err){
            console.log(err)
        })
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