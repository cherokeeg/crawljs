// request url
// npm install request
var request    = require('request');

// cheerio, parse the html
// npm install cheerio
var cheerio    = require('cheerio');

// iconv, convert SHIFT_JIS to utf-8
// npm install iconv
var iconv      = require('iconv');

// mysql
// npm install mysql
var mysql      = require('mysql');
var connection = mysql.createConnection({
	host       : 'www.sample.com',
	user       : 'user',
	password   : 'secret',
	database   : 'datebase',
	charset    : 'utf8mb4'
});


function debug(log) {
	var debugFlag = false;
	if (typeof(debugFlag) != 'undefined' && debugFlag) {
		console.log(log);
	}
}

// sleep
function sleep(milliSeconds) {
    var startTime = new Date().getTime();
    while (new Date().getTime() < startTime + milliSeconds);
};

request.get({
	url: 'http://www.amazon.co.jp/gp/site-directory/',
	encoding: null
}, function(err, res, body) {
	// convert the page code to utf8
	var html = new iconv.Iconv('SHIFT_JIS', 'utf-8').convert(body);
	// the whole of webpage data has been collected. parsing time!
	$ = cheerio.load(html);
	$('.popover-grouping').each(function(i, elem) {
		var groupElement = this;
		var groupName = $(groupElement).find('.popover-category-name').text();	
		debug(groupName);
		sleep(2000);
		request.get({
			url: 'http://translate.google.cn/?hl=zh-CN&ie=UTF-8&langpair=ja|zh-CN&text=' + encodeURIComponent(groupName),
			headers: {
				'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36'
			}
		}, function(err, res, body) {
			var reg = /TRANSLATED_TEXT=\'(.*)\';INPUT_TOOL_PATH=/g;
			var strCN = reg.exec(body)[1];
			debug(strCN)
			connection.query('INSERT INTO ?? SET ?, GMT_MODIFIED = NOW()', ['t_group', {NAME: strCN, NAME_JP: groupName}], function(err, result) {  
				if (err) throw err;
				var id = result.insertId;
				debug(id);
				$(groupElement).find('.nav_cat_links li a').each(function(i, elem) {
					var a = $(this);
					var categroyName = a.text();
					var categroyUrl = a.attr('href');
					debug(categroyName);
					debug('start categroy');
					sleep(2000);
					request.get({
						url: 'http://translate.google.cn/?hl=zh-CN&ie=UTF-8&langpair=ja|zh-CN&text=' + encodeURIComponent(categroyName),
						headers: {
							'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36'
						}
					}, function(err, res, body) {
						var reg = /TRANSLATED_TEXT=\'(.*)\';INPUT_TOOL_PATH=/g;
						var strCN = reg.exec(body)[1];
						debug(strCN);
						connection.query('INSERT INTO ?? SET ?, GMT_MODIFIED = NOW()', ['t_categroy', {GROUP_ID: id, NAME: strCN, NAME_JP: categroyName, URL: categroyUrl}], function(err, result) {
							if (err) throw err;
							var id = result.insertId;
							debug(id);
						});
					});
				});
			});
		});
	});
});
