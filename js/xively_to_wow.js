// xively_to_wow.js
// mike@saunby.net February 2014
//

https = require('https');
var settings = require('./settings.js');

function dateUTC()
{
    var now=new Date();
    var YYYY=now.getUTCFullYear();
    var MM=now.getUTCMonth()+1;
    MM=MM < 10 ? "0"+MM : MM;
    var DD=now.getUTCDate();
    DD=DD < 10 ? "0"+DD : DD;
    var hh=now.getUTCHours();
    hh=hh < 10 ? "0"+hh : hh;
    var mm=now.getUTCMinutes();
    mm=mm < 10 ? "0"+mm : mm;
    var ss=now.getUTCSeconds();
    ss=ss < 10 ? "0"+ss : ss;
    return ""+YYYY+"-"+MM+"-"+DD+" "+hh+":"+mm+":"+ss;
}

xivelyURL='https://api.xively.com/v2/feeds/' + settings.id + '?key=' + settings.key;

function getData(){
    https.get(xivelyURL, function(res) {
	var body = '';

	res.on('data', function(chunk) {
		body += chunk;
	    });

	res.on('end', function() {
		var response = JSON.parse(body);
		//console.log("Got response: ", response.datastreams);
		for( ds in response.datastreams ){
		    console.log( response.datastreams[ds].id );
		    console.log( response.datastreams[ds].current_value );
		    console.log( response.datastreams[ds].at );
		}
	    });
    }).on('error', function(e) {
	    console.log("Got error: ", e);
	});
}

var interval = 10 * 1000; // in miliseconds

var timerLoop = function() {
    var dateutc = dateUTC();
    console.log( "timerLoop @ " + dateutc );
    getData();
    setTimeout( timerLoop, interval );
}

    
    timerLoop();