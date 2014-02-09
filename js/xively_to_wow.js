// xively_to_wow.js
// mike@saunby.net February 2014
//

https = require('https');
http = require('http');
querystring = require('querystring');
var settings = require('./settings.js');

// Format date and time as WOW likes it (UTC)
function dateUTC( now )
{
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


// WOW wants pressure in inches of mercury. 
// hPa from both would be tidier.  Whatever... 
function converthPaToHgInch( pa ){
    var hgin = pa * 0.0295299830714;
    return hgin.toPrecision(4);
}

// NB this function takes SLP in hPa and altitude in metres and return MSLP.
// Approximate, but should be good for typical UK ground surface. 
function slpToMslp( slp, altitude ){
    var mslp = slp / Math.pow((1.0 - altitude * 2.25577e-5),5.25588); 
    //console.log('MSLP ' + mslp);
    return mslp;
}

// AirPi reports in Pa
function convertSLPToHgInMSLP( pa ){
    var slp = pa * 0.01;
    return converthPaToHgInch( slpToMslp( slp, settings.altitude ) );
}

function processDatastream( s ){
    var at = dateUTC( new Date( s.at ) );
    switch( s.id ){
    case '4':
	// Pressure.  Report MSLP in inches of mercury.
	// Requires adjustment for altitude. 
	return({'baromin':convertSLPToHgInMSLP( s.current_value ),'dateutc':at});
	break;
    default:
	return(null)
    }
}



function wowUpload(ob){
    ob.siteid=settings.siteid;
    ob.siteAuthenticationKey=settings.siteAuthenticationKey; 
    var query = querystring.stringify( ob );
    console.log('WOW query ' + query); 
    var wowURL='http://wow.metoffice.gov.uk/automaticreading?' + query;
    http.get(wowURL, function(res) {
	    res.on('end', function() {
		    console.log( "WOW upload done.");
		});
	}).on('error', function(e) {
		console.log("Got error: ", e);
	    });
}

// Put your feed ID and API key in the file settings.js
var xivelyURL='https://api.xively.com/v2/feeds/' + settings.id + '?key=' + settings.key;

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
		    var ob =  processDatastream( response.datastreams[ds] );
		    if( ob != null){
			if( settings.wow ){
			    wowUpload( ob ); 
			}
			console.log( ob );
		    }
		    //console.log( response.datastreams[ds].id );
		    //console.log( response.datastreams[ds].current_value );
		    //console.log( response.datastreams[ds].at );
		}
	    });
    }).on('error', function(e) {
	    console.log("Got error: ", e);
	});
}

var interval = settings.interval * 1000; // in miliseconds

var timerLoop = function() {
    var dateutc = dateUTC( new Date() );
    console.log( "timerLoop @ " + dateutc );
    getData();
    setTimeout( timerLoop, interval );
}

    
    timerLoop();