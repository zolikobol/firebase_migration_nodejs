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

Promise.all([inCsv, outCsv]).then(values => { 
    json1 = values[0];
    json2 = values[1];
    console.log("input and output files read");
    helper.pairTokenWithRegid(json1 , json2 , function(result , regID){
        console.log("paired");
        unsubscribeFromTopic(regID);
  })
});

function unsubscribeFromTopic(regID){

    console.log("unsubscribeTopic");

    var result = regID.map(function(obj){

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
                    str = JSON.parse(str);
                    if(typeof str["rel"] != "undefined"){
                        var keys = Object.keys(str["rel"]["topics"]);
                        var newTopics = getOldTopics(keys);
                        console.log(newTopics);
                    }
                    //var key = Object.keys(str["rel"]["topics"]);
                    //var len = key.length;
                    /*for(var i = 0; i < len; i++){
                        //unsubscribe(regID , keys[i]);
                    }*/
            });
        }
        https.request(options , callback).end();
    })
}

//unsubscribe("cYqZxvRGgEY:APA91bGl_bgg11gbxVKV9-66wx4uEk_OSbOCBru3fKMMHHL8C_eTymLhbdWXT-jUQv2Q8PR0oC1NeUGyL0xbL4FCyK7iaZODnzxrJGt6FG42MIxD3vfuy3Ebg_3oz8XcLKZayyBAp4KX" , "content-region-eu");

function unsubscribe(regID , topic){
    var options = {
        to: "/topics/" + topic,
        registration_tokens: [regID]
    }

    request({
        url: "https://iid.googleapis.com/iid/v1:batchRemove",
        method: "POST",
        headers: {
            "content-type": "application/json",
            "Authorization" : "key=AIzaSyA18DOy5YTyPoUFK8x6hASacSL3xH68upc"
        },
        json: true,
        body: options
    }, function (error, response, body){
        console.log(response);
    });
}

function getOldTopics(topics){

    var topicsMap = {
        Platform_iOS : "Platform_iOS",
        Device_Type_iPad : "DeviceType_iPad",
        Paid_User : "UserType_Paid",
        Free_User : "UserType_Free",
        LoggedIn_Yes : "LoggedIn"

    }

    return topics.map(function(obj) {
        if(typeof topicsMap[obj] !== "undefined"){
            return topicsMap[obj];
        }
        return obj;  
    })

}