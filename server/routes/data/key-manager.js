var exports = module.exports = {};

const multiplier = process.env.MULTIPLIER;
const const1 = process.env.CONST1;
const const2 = process.env.CONST2;

exports.generateKey = function() {
	return Buffer.from("" + (Math.floor(Math.random() * multiplier) * const1 + const2)).toString('base64');
};

exports.validateKey = function(key) {
	return parseInt(Buffer.from(key, 'base64')) % const1 === const2;
};
