var request 		= require('request'),
	cheerio			= require('cheerio'),
	querystring 	= require('querystring'),
	iconv 			= require('iconv-lite'),
	xml2js 			= require('xml2js');

// really don't wanna do this for all strings...
String.prototype.clean = function() {
	return this.replace(/\s+/g, ' ').trim();
}


// search for object key, passing it's value
keyOf = function( object, value ){
	for (var key in object){
		if (hasOwnProperty.call(object, key) && object[key] === value) return key;
	}
	return null;
}

var CorreiosOptions = {

	baseUrls: {

		track: 'http://websro.correios.com.br/sro_bin/txect01$.QueryList?P_LINGUA=001&P_TIPO=001&P_COD_UNI=',
		price: 'http://ws.correios.com.br/calculador/CalcPrecoPrazo.aspx'

	},

	// Correios delivery types translation map
	// side comments are from correios table (including portuguese mistakes)
	deliveryTypes: {

		sedex: 							40010, // SEDEX sem contrato
		sedex_contract_1:				40096, // SEDEX com contrato
		sedex_contract_2:				40436, // SEDEX com contrato
		sedex_contract_3:				40444, // SEDEX com contrato
		sedex_contract_4:				40568, // SEDEX com contrato
		sedex_contract_5:				40606, // SEDEX com contrato
		
		sedex_cobrar: 					40045, // SEDEX a Cobrar, sem contrato
		sedex_a_cobrar_contract: 		40126, // SEDEX a Cobrar, com contrato

		sedex_10: 						40215, // SEDEX 10, sem contrato
		sedex_hoje: 					40290, // SEDEX Hoje, sem contrato

		esedex_contract: 				81019, // e-SEDEX, com contrato
		esedex_contract_priority: 		81027, // e-SEDEX Prioritário, com conrato				
		esedex_contract_express: 		81035, // e-SEDEX Express, com contrato

		esedex_contract_1: 				81868, // (Grupo 1) e-SEDEX com contrato
		esedex_contract_2: 				81833, // (Grupo 2) e-SEDEX com contrato
		esedex_contract_3: 				81850, // (Grupo 3) e-SEDEX com contrato

		pac: 							41106, // PAC sem contrato
		pac_contract: 					41068  // PAC com contrato

	},


	// Correios error types translation map
	errorTypes: {

		'0': 		'Processamento com sucesso',
		'-1': 		'Código de serviço inválido',
		'-2': 		'CEP de origem inválido',
		'-3': 		'CEP de destino inválido',
		'-4': 		'Peso excedido',
		'-5': 		'O Valor Declarado não deve exceder R$ 10.000,00',
		'-6': 		'Serviço indisponível para o trecho informado',
		'-7': 		'O Valor Declarado é obrigatório para este serviço',
		'-8': 		'Este serviço não aceita Mão Própria',
		'-9': 		'Este serviço não aceita Aviso de Recebimento',
		'-10': 		'Precificação indisponível para o trecho informado',
		'-11': 		'Para definição do preço deverão ser informados, também, o comprimento, a largura e altura do objeto em centímetros (cm).',
		'-12': 		'Comprimento inválido.',
		'-13': 		'Largura inválida.',
		'-14': 		'Altura inválida.',
		'-15': 		'O comprimento não pode ser maior que 105 cm.',
		'-16': 		'A largura não pode ser maior que 105 cm.',
		'-17': 		'A altura não pode ser maior que 105 cm.',
		'-18': 		'A altura não pode ser inferior a 2 cm.',
		'-20': 		'A largura não pode ser inferior a 11 cm.',
		'-22': 		'O comprimento não pode ser inferior a 16 cm.',
		'-23': 		'A soma resultante do comprimento + largura + altura não deve superar a 200 cm.',
		'-24': 		'Comprimento inválido.',
		'-25': 		'Diâmetro inválido',
		'-26': 		'Informe o comprimento.',
		'-27': 		'Informe o diâmetro.',
		'-28': 		'O comprimento não pode ser maior que 105 cm.',
		'-29': 		'O diâmetro não pode ser maior que 91 cm.',
		'-30': 		'O comprimento não pode ser inferior a 18 cm.',
		'-31': 		'O diâmetro não pode ser inferior a 5 cm.',
		'-32': 		'A soma resultante do comprimento + o dobro do diâmetro não deve superar a 200 cm.',
		'-33': 		'Sistema temporariamente fora do ar. Favor tentar mais tarde.',
		'-34': 		'Código Administrativo ou Senha inválidos.',
		'-35': 		'Senha incorreta.',
		'-36': 		'Cliente não possui contrato vigente com os Correios.',
		'-37': 		'Cliente não possui serviço ativo em seu contrato.',
		'-38': 		'Serviço indisponível para este código administrativo'

	}

};

/**
 * Check if supplied cep is valid
 * @param  {string}  $cep CEP code
 * @return {Boolean}
 */
function isZipcodeValid ($cep) {
	return $cep.match(/^\d{5}\-?\d{3}$/);
}

var correios = module.exports = {

	/**
	 * Track some package in Correios website
	 * 
	 * @param  {string}   code     		correios tracking code
	 * @param  {Function} callback 		callback to execute when have some data or error
	 */
	track: function ( code, callback ) {
		if ( !callback )
			throw new Error('Correios error -> you must specify a callback');

		code = code.toUpperCase();
		
		var url = CorreiosOptions.baseUrls.track + code;

		return request( url, { encoding: null}, function( error, response, body ) {

			if ( error )
				return callback( error );

			if ( response.statusCode != 200 )
				return callback( new Error('Correios error -> http status code:' + response.statusCode) );

			body = iconv.decode(body, 'iso-8859-1');
			
			// parse html
			$ = cheerio.load( body, {
				lowerCaseTags: true
			});

			// has tracking table?
			if ( !$('table').length ) {
				var text = $('p').text().clean();

				if ( text.indexOf(code) > -1 )
					return callback( null, text ); // valid tracking code at least
				else
					return callback( new Error('Correios error -> invalid tracking code') ); // invalid tracking code dude.

			}

			var trackData = [],
				row1;

			// * will ignore first TR, correios doesn't know thead...
			// * every record uses two tr's
			// * will use the same keys of correios mobile but using english (doesnt make sense the keys in ptbr)
			// (almost decent html, but has a simple captacha and I don't wanna to eval it)
			for ( var i = 1; i < $('tr').length; i += 2 ) {
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
			return callback( null, trackData );

		});
	},

	/**
	 * Return price and estimated delivery
	 * 
	 * @param  {object}   options  
	 *         This will received the following vars:
	 *         <p>
	 *         {string} serviceType   'sedex_contract_1', 'sedex_contract_2', 'sedex_contract_3', 
	 *         						  'sedex_contract_4', 'sedex_contract_5', 'sedex_cobrar', 
	 *         						  'sedex_a_cobrar_contract', 'sedex_10', 'sedex_hoje', 
	 *         						  'esedex_contract', 'esedex_contract_priority', 
	 *         						  'esedex_contract_express', 'esedex_contract_1', 
	 *         						  'esedex_contract_2', 'esedex_contract_3', 'pac', 
	 *         						  'pac_contract'
	 *         <p>
	 *         {string}  from 		  CEP like 00000-000 or 00000000 [required]
	 *         <p>
	 *         {string}  to 		  CEP like 00000-000 or 00000000 [required]
	 *         <p>
	 *         {Boolean} handDelivery should use hand delivery service? [empty means no]
	 *         <p>
	 *         {float}   value 		  value of the package in case you need insurance [empty means 0.00]
	 *         <p>
	 *         {Boolean} notice 	  wants receive a notice when package is delivered? [empty means no]
	 *         <p>
	 *         {int}     format 	  1 - Box/Package, 2 - Coil/Prism, 3 - Envelope [empty means box]
	 *         <p>
	 *         {int}     weight 	  Package weight in KG (including package) [required]
	 *         <p>
	 *         {int}     width 		  Package width in CM (including package) [required by package type]
	 *         <p>
	 *         {int}     height 	  Package height in CM (including package) [required by package type]
	 *         <p>
	 *         {int}     length 	  Package length in CM (including package) [required by package type]
	 *         <p>
	 *         {int}     diameter 	  Package diameter in CM (including package) [required by package type]
	 *         <p>
	 *         {string}  companyCode  Administrative Code with ECT [can be empty]
	 *         <p>
	 *         {string}  companyPwd	  First 8 digits of CNPJ used in ECT contract. [can be empty]
	 * 
	 * @param  {Function} callback
	 * @return {error|data}
	 */
	getPrice: function( options, callback ) {
		if ( !callback )
			throw new Error('Correios error -> you must specify a callback');

		// internal assigns
			// delivery info
		var serviceType 		= CorreiosOptions.deliveryTypes[ options.serviceType ] || '',
			from 				= options.from 			|| '',
			to 					= options.to 			|| '',
			
			handDelivery		= !!options.handDelivery 	? 'S' : 'N', // correios uses this enum
			value 				= !!options.value 			? options.value : 0.0,
			notice 				= !!options.notice 			? 'S' : 'N', // correios uses this enum
			
			// package info
			format 				= options.format 		|| 1,
			width 				= options.width 		|| 0,
			height 				= options.height 		|| 0,
			length		 		= options.length 		|| 0,
			diameter 			= options.diameter 		|| 0,
			weight 				= options.weight 		|| 0,

			// contract info
			companyCode 		= options.companyCode 	|| "",
			companyPwd 			= options.companyPwd 	|| "";



		var qs = querystring.stringify({

			StrRetorno: 			'xml',
			nCdServico: 			serviceType,
			scepOrigem: 			from,
			scepDestino: 			to,
			nVlPeso: 				weight,
			sCdMaoPropria: 			handDelivery,
			nVlValorDeclarado: 		value,
			sCdAvisoRecebimento: 	notice,
			nCdEmpresa: 			companyCode,
			sDsSenha: 				companyPwd,
			nCdFormato: 			format,
			nVlComprimento: 		length,
			nVlAltura: 				height,
			nVlLargura: 			width,
			nVlDiametro: 			diameter

		});

		makeRequest({
			
			method: 'post',
			qs: qs

		}, function ( error, data ) {

			if ( error )
				return callback( new Error('Correios error -> ' + error) );

			if (!data.cServico)
				return callback( new Error('Correios error -> invalid response contents' ) );
			
			var data = data.cServico;

			if ( data.Erro != 0 ) 
				return callback( new Error('Correios error -> get this error on response: ' + CorreiosOptions.errorTypes[data.Erro] || 'unknown error code' ) );

			return callback( null, {

				serviceType: 			keyOf(CorreiosOptions.deliveryTypes, parseInt(data.Codigo)),
				estimatedDelivery: 	parseInt(data.PrazoEntrega),
				GrandTotal: 			parseFloat(data.Valor.replace(/,/g, '.')),
				handDeliveryPrice: 		parseFloat(data.ValorMaoPropria.replace(/,/g, '.')),
				deliveryNoticePrice: 	parseFloat(data.ValorAvisoRecebimento.replace(/,/g, '.')),
				declaredValuePrice: 	parseFloat(data.ValorValorDeclarado.replace(/,/g, '.')),
				homeDelivery: 			data.EntregaDomiliar == 'S' ? true : false,
				saturdayDelivery: 		data.EntregaSabado == 'S'? true : false

			});

		});
	}

};

function makeRequest (options, callback) {

	request[ options.method ]( {

		uri: CorreiosOptions.baseUrls.price + '?' + options.qs

	}, function( error, response, body ) {

		if ( error )
			return callback(error);

		if ( response.statusCode != 200 )
			return callback( new Error('Correios error -> http status code:' + response.statusCode) );

		// convert XML to JSON
		var parser = new xml2js.Parser({ normalize: true, explicitRoot: false, explicitArray: false });

		parser.parseString( body, function( error, result ) {

			if ( error )
				return callback( new Error('Correios error -> error parsing correios xml response') );

			// finally the response we want (or not)
			return callback( null, result );

		});

	});

}
