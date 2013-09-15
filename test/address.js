var assert = require('assert');
var correios = require('../lib/correios');

// valid postal code
correios.address('01001000', function(err, result) {
  assert.equal(typeof result, 'object');
  assert.equal(result.cep, '01001-000');
  assert.equal(result.logradouro, 'Praça da Sé - lado ímpar');
  assert.equal(result.bairro, 'Sé');
  assert.equal(result.localidade, 'São Paulo');
  assert.equal(result.uf, 'SP');
  assert.equal(result.ibge, '3550308');

  console.log("Address test: ok")
});


// invalid postal code
correios.address('0100000', function(err, result) {
  assert.equal(typeof err, 'object');
  assert.equal(err.message, 'Correios error -> First parameter must be a valid postal code (cep)');
  console.log("Invalid posta code test: ok");
});
