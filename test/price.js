var assert = require('assert');
var correios = require('../lib/correios');

correios.price({
  serviceType:    "sedex",
  from:           "88330-725",
  to:             94010030,
  weight:         "3",
  handDelivery:   true,
  width:          11,
  height:         11,
  length:         16
}, function(err, result) {
  assert.equal(err, null, err);
  assert.equal(typeof result, "object");
  assert.equal(result.serviceType, "sedex");

  console.log("Result test: ok");
});
