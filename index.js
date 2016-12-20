var http = require("http");
var Helper = require("./helper.js");
var Promise = require("promise");

var helper = new Helper();

var json1, json2;

var inCsv = new Promise((resolve , reject) => {
    helper.readCsvFile("./csv/com.economist.ipad.ap.csv" , function(csvContent){  
        resolve(csvContent);
    })
});

var outCsv =  new Promise((resolve , reject) => {
    helper.readCsvFile("./csv/com.economist.ipad.ap_out.csv" , function(csvContent){
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

    var result = regID.map(function(obj){
        var options = {
            host: "https://iid.googleapis.com",
            path: "/iid/info/" + obj,
            method: 'GET',
            headers: {Authorization : "key=AIzaSyA18DOy5YTyPoUFK8x6hASacSL3xH68upc"}
        }

        console.log(options);

        /*callback = function(response) {

            var str = '';

            response.on('data' , function (chunk){
                str += chunk;
            });


            response.on('end' , function (){
                console.log(str);
            });

        }

        http.request(options , callback).end();*/
    })

    

}

/*var options = {
    host: "qa.espresso.economist.com",
    path: "/api/v1/issue/AP/json"
}

callback = function(response) {

    var str = '';

    response.on('data' , function (chunk){
        str += chunk;
    });


    response.on('end' , function (){
        console.log(str);
    });

}

http.request(options , callback).end();*/