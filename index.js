var https = require("https");
var request = require('request');
var Helper = require("./helper.js");
var Promise = require("promise");
var asynch = require("asynch");
var rp = require('request-promise');

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

Promise.all([inCsv, outCsv]).then(values => { 
    json1 = values[0];
    json2 = values[1];
    console.log("input and output files read");
    helper.pairTokenWithRegid(json1 , json2 , function(result , regID){
        console.log("paired");
        var unsubscribed = unsubscribeFromTopic(regID);
        unsubscribed.then(function(result){
            console.log("aa");
        }).catch(function(err){
            console.log("error");
        });
  })
});

function unsubscribeFromTopic(regID){

    console.log("unsubscribeTopic");

    var devicesCount = 0;

    var result = new Array();

    Promise.all(regID.map(function(item){
    
        var options = {
            uri: "https://iid.googleapis.com//iid/info/" + item.registration_token + "?details=true",
            method: 'GET',
            headers: {Authorization : "key=AIzaSyA18DOy5YTyPoUFK8x6hASacSL3xH68upc"}
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
                        result.push({
                            reg_token: item.registration_token,
                            tags: keys
                        })
                        //console.log(item.registration_token , keys)
                        /*for(var i = 0; i< len; i++){
                            unsubscribe(item.registration_token , keys[i]);
                        }*/
                    }
                }

            })
            .catch(function(err){
                //console.log(err);
            })
    })).then(function(res){
        console.log(result);
    });
}

//unsubscribe('drRkOuztyGY:APA91bE6iwtHMBQ74CnxIg0Ik1-R35YRmTxYX1Nx-WUt7ITS5Drbu7tTbH7xdfOwTnIJW2tir4y59Lng0yCS7jhlpk6JqzlrutowtlVozfq69VsXahW-HNTlBUJ8hzI1N_vjwuAy5TSd' , 'Device_Type_iPad');

function unsubscribe(regID , topic){

    console.log(regID , topic);

    var options = {
        uri: 'https://iid.googleapis.com/iid/v1:batchRemove',
        method: 'POST',
        headers: {
            'Authorization' : "key=AIzaSyA18DOy5YTyPoUFK8x6hASacSL3xH68upc",
    
        },
        body: {
            "to": "/topics/" + topic,
            "registration_tokens": [regID]
        },
        json: true,
    };

    rp(options)
        .then(function(res){
            console.log(res)
        }).catch(function(err){
            //console.log(err)
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