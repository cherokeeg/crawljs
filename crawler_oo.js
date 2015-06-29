// request url
// npm install request
//var request    = require('request');
var request    = require('request-promise');

// cheerio, parse the html
// npm install cheerio
var cheerio    = require('cheerio');

// iconv, convert SHIFT_JIS to utf-8
// npm install iconv
var iconv      = require('iconv');

// mysql
// npm install mysql
var mysql      = require('mysql');
var pool  = mysql.createPool({
        connectionLimit : 10,
        host                    : 'www.sample.com',
        user                    : 'user',
        password                : 'secret',
        database                : 'dataabse',
        charset                 : 'utf8mb4'
});

// insert mysql
function save(client, obj) {
        var id;
        client.query('INSERT INTO ?? SET ?, GMT_MODIFIED = NOW()', obj, function(err, result) {  
                if (err) throw err;
                id = result.insertId;
    });
        return id;
};

function saveAsTranslate(columnName, strJP, client, arr) {
        sleep(delay);
        var id;
        var obj = arr[1];
        request.get({
                url: 'http://translate.google.cn/?hl=zh-CN&ie=UTF-8&langpair=ja|zh-CN&text=' + encodeURIComponent(strJP),
                headers: {
                        'User-Agent': 'Mozilla/5.0 (Windows NT 6.1; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/43.0.2357.130 Safari/537.36'
                }
        }).then(function(body) {
                var html = body.toString();
                //console.log(html);
                var reg = /TRANSLATED_TEXT=\'(.*)\';INPUT_TOOL_PATH=/g;
                console.log(strJP);
                strCN = reg.exec(html)[1];
                obj[columnName] = strCN;
                arr[1] = obj;
                console.log(strCN);
                id = save(client, arr);
                console.log(id);
        });
        return id;
}

request.get({
        url: 'http://www.amazon.co.jp/gp/site-directory/',
        encoding: null
}).then(function(body) {
        // convert the page code to utf8
        var html = new iconv.Iconv('SHIFT_JIS', 'utf-8').convert(body);
        // the whole of webpage data has been collected. parsing time!
        $ = cheerio.load(html);
        $('.popover-grouping').each(function(i, elem){
                var groupName = $(this).find('.popover-category-name').text();
                var groupId = saveAsTranslate('NAME', groupName, pool, ['t_group', {NAME_JP: groupName}]);
                $(this).find('.nav_cat_links li a').each(function(i, elem){
                        var a = $(this);
                        var categroyName = a.text();
                        var categroyUrl = a.attr('href');
                        saveAsTranslate('NAME', categroyName, pool, ['t_categroy', {GROUP_ID: groupId, NAME_JP: categroyName, URL: categroyUrl}]);
                });
        });
});

console.log('done');
