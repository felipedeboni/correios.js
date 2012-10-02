var request = require('request'),
	cheerio	= require('cheerio');

// really don't wanna do this for all strings...
String.prototype.clean = function() {
	return this.replace(/\s+/g, ' ').trim();
}

var correios = module.exports = {

	track: function (code, callback) {
		code = code.toUpperCase();
		
		var url = "http://websro.correios.com.br/sro_bin/txect01$.QueryList?P_LINGUA=001&P_TIPO=001&P_COD_UNI=" + code;

		return request(url, {}, function(error, response, body) {
			
			if (error)
				return callback(error);

			if (response.statusCode != 200)
				return callback(new Error("http status code:" + response.statusCode));

			// parse html
			$ = cheerio.load(body, {
				lowerCaseTags: true
			});

			// has tracking table?
			if (!$('table').length) {
				var text = $('p').text().clean();

				if (text.indexOf(code) > -1)
					return callback(null, text); // valid tracking code at least
				else
					return callback(); // invalid tracking code dude.

			}

			var trackData = [],
				row1;

			// * will ignore first TR, correios doesn't know thead...
			// * every record uses two tr's
			// * will use the same keys of correios mobile but using english (doesnt make sense the keys in ptbr)
			// (almost decent html, but has a simple captacha and I don't wanna to eval it)
			for (var i = 1; i < $('tr').length; i += 2) {
				row1 = $('tr').eq(i);

				trackData.push({
					date		: row1.children('td').eq(0).text().clean(),
					spot		: row1.children('td').eq(1).text().clean().toLowerCase(), // remembers me sheldon from bbt
					status		: row1.children('td').eq(2).text().clean().toLowerCase(),
					guidance	: $('tr').eq(i+1).children('td').eq(0).text().clean().toLowerCase()
				});
			}

			// return the track data with last updates first
			// if you need the lasts first, make an array reverse!
			return callback(null, trackData);

		});
	}

};