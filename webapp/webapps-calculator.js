var languages = {
	'fr': {
		'in': 'dans',
		'&&': 'et',
		'||': 'ou',
		'sqrt': 'racine',
		'pow': 'puissance',
		'if': 'si',
		'test, trueValue, falseValue': 'test, valeurVrai, valeurFaux',
		'convert': 'conversion',
		'1, \'srcUnit\', \'dstUnit\'': '1, \'de\', \'vers\''
	},
	'en': {
		'&&': 'and',
		'||': 'or',
	}
};

var language = (typeof languages[navigator.language] !== 'undefined') ? languages[navigator.language] : languages['en'];

function lang(text) {
	return language[text] || text;
}

function Calculator() {
	this.binaryOperators = this.createBinaryOperators();
	this.unaryOperators = this.createUnaryOperators();
	this.functions = this.createFunctions();
};

Calculator.prototype.createBinaryOperators = function() {
	// En Javascript : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
	// En Java : https://docs.oracle.com/javase/tutorial/java/nutsandbolts/operators.html
	var precedence = 12;
	var operators = {};
	
	function add(name, calculate) {
		var op = { name: lang(name), precedence: precedence, calculate: calculate };
		jsep.addBinaryOp(op.name, op.precedence);
		operators[op.name] = op;
	}

	add('*', function(a, b) { return a * b; });
	add('/', function(a, b) { return a / b; });
	add('%', function(a, b) { return a % b; });
	precedence--;
	add('+', function(a, b) { return a + b; });
	add('-', function(a, b) { return a - b; });
	precedence--;
	add('<<', function(a, b) { return a << b; });
	add('>>', function(a, b) { return a >> b; });
	add('>>>', function(a, b) { return a >>> b; });
	precedence--;
	add('<', function(a, b) { return a < b; });
	add('>', function(a, b) { return a > b; });
	add('<=', function(a, b) { return a <= b; });
	add('>=', function(a, b) { return a >= b; });
	add('in', function(a, b) { return b.indexOf(a) >= 0; });
	precedence--;
	add('===', function(a, b) { return a === b; });
	add('!==', function(a, b) { return a !== b; });
	add('=', function(a, b) { return a == b; });
	add('==', function(a, b) { return a == b; });
	add('<>', function(a, b) { return a != b; });
	add('!=', function(a, b) { return a != b; });
	precedence--;
	add('&', function(a, b) { return a & b; });
	precedence--;
	add('^', function(a, b) { return a ^ b; });
	precedence--;
	add('|', function(a, b) { return a | b; });
	precedence--;
	add('&&', function(a, b) { return a && b; });
	precedence--;
	add('||', function(a, b) { return a || b; });

	return operators;
};

Calculator.prototype.createUnaryOperators = function() {
	var operators = {};

	function add(name, calculate) {
		var op = { name: lang(name), calculate: calculate };
		jsep.addUnaryOp(op.name);
		operators[op.name] = op;
	}

	add('+', function(a) { return a; });
	add('-', function(a) { return -a; });
	add('!', function(a) { return !a; });
	add('²', function(a) { return Math.pow(a, 2); });
	add('√', function(a) { return Math.sqrt(a); });
	add('~', function(a) { return ~a; });

	return operators;
};

Calculator.prototype.createFunctions = function() {
	var functions = {};

	function add(name, arguments, calculate) {
		var f = { name: lang(name), arguments: arguments ? lang(arguments) : '', calculate: calculate || Math[name] };
		functions[f.name] = f;
	}

	'random'.split(',').forEach(function(name, index) {
		add(name);
	});

	'abs,cos,sin,tan,acos,asin,atan,ceil,floor,round,exp,log,sqrt'.split(',').forEach(function(name, index) {
		add(name, 'x');
	});

	'pow'.split(',').forEach(function(name, index) {
		add(name, 'x, n');
	});

	'min,max'.split(',').forEach(function(name, index) {
		add(name, 'x, y*');
	});

	add('if', 'test, trueValue, falseValue', function(t, v1, v2) { return t ? v1 : v2; });
	add('convert', '1, \'srcUnit\', \'dstUnit\'', function(n, u1, u2) { return new Convertor().convert(n, u1, u2); });

	return functions;
};

Calculator.prototype.eval = function(tree) {
	var operator, value, left, right, call, array;
	if (typeof tree === 'string')
		tree = jsep(tree);
	switch (tree.type) {
		case 'Literal':
			return tree.value;
		case 'UnaryExpression':
			operator = this.unaryOperators[tree.operator.toLowerCase()];
			value = this.eval(tree.argument);
			return operator.calculate(value);
		case 'BinaryExpression':
			operator = this.binaryOperators[tree.operator.toLowerCase()];
			left = this.eval(tree.left);
			right = this.eval(tree.right);
			return operator.calculate(left, right);
		case 'CallExpression':
			call = this.functions[tree.callee.name.toLowerCase()];
			array = tree.arguments.map((function(subtree, index) {
				return this.eval(subtree);
			}).bind(this));
			return call.calculate.apply(null, array);
		case 'ArrayExpression':
			return tree.elements.map((function(subtree, index) {
				return this.eval(subtree);
			}).bind(this));
		case 'ConditionalExpression':
			value = this.eval(tree.test);
			return value ? this.eval(tree.consequent) : this.eval(tree.alternate);
		default:
			throw new Error('Unsupported node type ' + tree.type);
	}
};

Calculator.prototype.debug = function(tree) {
	function append(obj, ul) {
		for (var prop in obj) {
			if (obj.hasOwnProperty(prop)) {
				var value = obj[prop];
				var li = $("<li />").appendTo(ul);
				var nameSpan = $("<span />").addClass("name").appendTo(li).text(prop + ": ");
				var valueSpan = $("<span />").addClass("value").appendTo(li);

				if (typeof value === "string") {
					valueSpan.addClass("string").text("'" + value + "'");
				} else if (typeof value === "number") {
					valueSpan.addClass("number").text(value);
				} else if (typeof value === "boolean") {
					valueSpan.addClass("boolean").text(value + "");
				} else {
					var child = $('<ul />');
					valueSpan.addClass("object").append(child);
					append(value, child);
				}
			}
		}
	};
	var root = $('<ul />');
	append(tree, root);
	root.appendTo(document.body);
};


function Convertor() {
	this.categories = [];

	this.startCategory('Angle');
	this.addUnit('Degré', 1, 'deg');
	this.addUnit('Grade', 0.9, 'gon');
	this.addUnit('Radian', 360 / (2 * Math.PI), 'rad');
	this.addUnit('Angle droit', 90, '');
	this.addUnit('Révolution', 360, '');
	this.addUnit('Minute angulaire', { d: 60 }, '′'); // ou arcminute ou Minute d'arc
	this.addUnit('Seconde angulaire', { d: 3600 }, '″'); // ou arcseconde ou Seconde d'arc

	this.startCategory('Charge');
	this.addUnit('ampère heure', 1000, 'Ah');
	this.addUnit('milliampère heure', 1, 'mAh');
	this.addUnit('coulomb', { m: 1000, d: 3600 }, ''); // 1 As
	this.addUnit('nanoseconde', 1111, '');

	this.startCategory('Energie');
	this.addUnit('Calorie', 4.1868, 'cal'); // calorie
	this.addUnit('kilocalorie', 4186.8, 'kcal'); // kilocalorie
	this.addUnit('thermie', 4186800, 'th'); // Mégacalorie
	this.addUnit('Joule', 1, 'J'); // joule
	this.addUnit('kilojoule', 1000, 'kJ'); // kilojoule
	this.addUnit('watt heure', 3600, 'Wh'); // watt-hour
	this.addUnit('kilowatt heure', 3600000, 'kWh'); // kilowatt-hour
	this.addUnit('Electron-Volt', 1.6021765e-19, 'eV'); // electronvolt
	this.addUnit('Pied-livre', 1.3558179483314, 'lb ft'); // pound force-foot
	this.addUnit('Pouce-livre', 0.112984829027617, 'lb in'); // pound force-inch
	this.addUnit('Unité thermale britannique', 1057, 'btu'); // British Thermal Unit
	this.addUnit('chevaux-vapeur heure', 2684519.53769617, 'hp hr'); // hoursepower hour
	this.addUnit('tonne TNT', 4.184e9, ''); // wikipedia FR explique pourquoi 4.184 et pas 4.6
	this.addUnit('Hiroshima', 15000 * 4.184e9, 'Little Boy'); // 15 000 tonnes TNT
	this.addUnit('Nagasaki', 22000 * 4.184e9, 'Fat Man'); // 21 à 23 000 tonnes TNT
	this.addUnit('newton-meter', 1, ''); // newton-meter
	this.addUnit('erg', 1e-7, ''); // newton-meter

	this.startCategory('Intensité lumineuse');
	this.addUnit('candela', 0.1, 'cd');
	this.addUnit('bougie', 1.018, '');
	this.addUnit('carcel', 9.8, '');

	this.startCategory('Longueur');
	this.addUnits(1, 10, 'nm,nanomètre,,,,,μm,micromètre,,,,,mm,millimètre,cm,centimètre,dm,décimètre,m,mètre,dam,décamètre,hm,hectomètre,km,kilomètre,,,,,Mm,mégamètre');
	this.addUnit('ångström', 0.1, 'Å');
	this.addUnit('Brasse', 1828800000, '');
	this.addUnit('Chaîne', 20116800000, ''); // 1000 liens
	this.addUnit('Lien', 201168000, '');
	this.addUnit('Levée', 101600000, '');
	this.addUnit('main', 101600000, ''); // 0.1016 mètre
	this.addUnit('Micron', 1000, '');
	this.addUnit('Mil (US)', 25400, '');
	this.addUnit('Mille', 1609344000000, 'mi');
	this.addUnit('Mille marin', 1852000000000, '');
	this.addUnit('Parcours', 228600000, '');
	this.addUnit('Perche', 5029200000, '');
	this.addUnit('PICA', 4217517.6, '');
	this.addUnit('Toise', 1828800000, ''); // 6 pieds
	this.addUnit('Aune', 1219200000, ''); // 4 pieds
	this.addUnit('Yard', 914400000, 'yd'); // 3 pieds
	this.addUnit('Verge', 914400000, 'vg'); // Verge = nom français de "yard"
	this.addUnit('Pied', 304800000, 'ft'); // 12 pouces
	this.addUnit('Pouce', 25400000, 'in');
	this.addUnit('micropouce', 25.4, 'μin');
	this.addUnit('Année lumière', 9460730472580800000000000, 'al'); // 9 460 730 472 580,8 km
	this.addUnit('Minute lumière', 17987547480000000000, ''); // 60 secondes lumière
	this.addUnit('Seconde lumière', 299792458000000000, ''); // c = 299 792 458 m/s
	this.addUnit('parsec', { m: 149597870700000000000 * 648000, d: Math.PI }, 'pc'); // parallaxe-seconde, 648 000/π ua
	this.addUnit('kiloparsec', { m: 149597870700000000000 * 648000 * 1000, d: Math.PI }, '');
	this.addUnit('mégaparsec', { m: 149597870700000000000 * 648000 * 1000000, d: Math.PI }, '');
	this.addUnit('marathon', 42194988000000, ''); // 42.194988 km
	this.addUnit('terrain de football', 91440000000, '');  // 100 yard
	this.addUnit('Unité astronomique', 149597870700000000000, 'ua'); // 149597870700 mètres

	this.startCategory('Masse');
	this.addUnits(1, 10, 'mg,milligramme,cg,centigramme,dg,décigramme,g,gramme,dag,décagramme,hg,hectogramme,kg,kilogramme,,,q,quintal,t,tonne');
	this.addUnit('Carat', 200, 'ct');
	this.addUnit('Livre', 453592.37, 'lb');
	this.addUnit('Grain', 64.79891, 'gr'); // 1 / 7000 livre
	this.addUnit('pennyweight', 1555.17384, 'pwt'); // 24 grains
	this.addUnit('Once', 28349.523125, 'oz');
	this.addUnit('Stone', 6350293.18, 'st'); // 14 livres
	this.addUnit('Tonne courte', 907184740, 'sh t'); // 2000 livres
	this.addUnit('Tonne longue', 1016046908.8, 'ton'); // 2240 livres
	this.addUnit('Once troy', 31103.4768, 'oz t');
	this.addUnit('Once avoirdupois', 28349.523125, 'oz av');
	this.addUnit('Livre troy', 373241.7216, 'lb t'); // 12 once troy
	this.addUnit('Livre avoirdupois', 453592.37, 'lb av'); // 16 once avoirdupois
	this.addUnit('masse solaire', 1.9884e36, ''); // 1.98855e30 kg sur wikipedia EN mais 1.9884e30 kg sur wikipedia FR
	this.addUnit('masse atomique', 1.660538921e-21, 'u'); // 1.660539040e−27 kg sur wikipedia EN mais 1.660538921e-27 kg sur wikipedia FR

	// this.startCategory('Pression');

	// this.startCategory('Puissance');

	this.startCategory('Surface');
	this.addUnit('millimètre carré', 0.000001, 'mm²');
	this.addUnit('centimètre carré', 0.0001, 'cm²');
	this.addUnit('décimètre carré', 0.01, 'dm²');
	this.addUnit('mètre carré', 1, 'm²');
	this.addUnit('décamètre carré', 100, 'dam²');
	this.addUnit('hectomètre carré', 10000, 'hm²');
	this.addUnit('kilomètre carré', 1000000, 'km²');
	this.addUnit('centiare', 1, 'ca');
	this.addUnit('are', 100, 'a');
	this.addUnit('hectare', 10000, 'ha');
	this.addUnit('mille carré', 2589988.110336, 'mi²');
	this.addUnit('yard carré', 9 * 0.09290304, 'yd²'); // 1 yard = 3 pied
	this.addUnit('pied carré', 0.09290304, 'pi²');
	this.addUnit('pouce carré', { m: 0.09290304, d: 12*12}, 'in²'); // 1 pouce = 1/12 de pied
	this.addUnit('acre', 4046.856422, '');

	this.startCategory('Température');
	this.addUnit('Celsius', { m: 1.8, o: 491.57 }, '°C');
	this.addUnit('Fahrenheit', { m: 1, o: 459.57 }, '°F');
	this.addUnit('Rankine', 1, 'R', '°Ra');
	this.addUnit('kelvin', 1.8, 'K');
	this.addUnit('Réaumur', { m: 2.25, o: 491.67 }, 'r', '°Ré');

	this.startCategory('Temps');
	this.addUnit('nanoseconde', 1, 'ns');
	this.addUnit('microseconde', 1000, 'μs');
	this.addUnit('milliseconde', 1000000, 'ms');
	this.addUnit('seconde', 1000000000, 's');
	this.addUnit('minute', 60000000000, 'm');
	this.addUnit('heure', 3600000000000, 'h');
	this.addUnit('jour', 86400000000000, 'j');
	this.addUnit('semaine', 604800000000000, '');
	this.addUnit('mois', { m: 31556926080000000, d: 12 }, ''); // 1/12 d'année
	this.addUnit('année', 31556926080000000, ''); // 365.2422 jours
	this.addUnit('an', 31556926080000000, '');
	this.addUnit('fortnight', 1209600000000000, ''); // 14 jours
	this.addUnit('décennie', 315569260800000000, '');
	this.addUnit('siècle', 3155692608000000000, '');
	this.addUnit('millénaire', 31556926080000000000, '');

	// this.startCategory('Vitesse');

	this.startCategory('Volume');
	this.addUnits(1, 1000, 'mm3,millimètre cube,cm3,centimètre cube,dm3,décimètre cube,m3,mètre cube');
	this.addUnits(1000, 10, 'ml,millilitre,cl,centilitre,dl,décilitre,l,litre,,,hl,hectolitre');
	this.addUnit('Gallon américain', 3785411.784, '');
	this.addUnit('Gallon impérial', 4546090, ''); // gallon britannique
	this.addUnit('Chopine française', 476073.0, '');
	this.addUnit('Chopine américaine', 473176.473, '');
	this.addUnit('Chopine anglaise', 568261.25, '');
	this.addUnit('Once liquide américaine', 29573.5295625, 'fl oz'); // 1/128 de gallon américain
	this.addUnit('Once liquide impériale', 28413.0625, ''); // (ou anglaise) 1/160 de gallon impérial
	this.addUnit('Pinte américaine', 473176.473, 'pt');
	this.addUnit('Pinte impériale', 568261.25 , '');
	this.addUnit('Quart américain', 946352.946, 'qt');
	this.addUnit('Quart impérial', 1136522.5 , '');
	this.addUnit('Pouce cube', 16387.064, '');
	this.addUnit('Pied cube', 28316846.592, '');
	this.addUnit('Yard cube', 764554857.984, '');
	this.addUnit('cup', 236588.2365, '');
	this.addUnit('dram', 3696.7162, '');
	this.addUnit('drop', 64.8524, '');
	this.addUnit('minim américaine', 61.61152, '');
	this.addUnit('tablespoon', 14786.76478, 'tbs');
	this.addUnit('teaspoon', 4928.921594, 'tsp');

	this.startCategory('Monétaire');
	this.addUnit('euro', 1, '€');
	if (this.moneyRates) {
		for (var currency in this.moneyRates) {
			var symbol = (currency === 'USD') ? '$' : (currency === 'GBP') ? '£' : ''; 
			this.addUnit(currency, 1 / this.moneyRates[currency], symbol);
		}
	}

}

Convertor.prototype.convert = function(value, srcUnit, dstUnit) {
	var candidates1 = this.findCandidates(srcUnit);
	if (candidates1.length === 0)
		throw Error('Unrecognized unit ' + srcUnit);
	var candidates2 = this.findCandidates(dstUnit);
	if (candidates2.length === 0)
		throw Error('Unrecognized unit ' + dstUnit);
	for (var i1 = 0; i1 < candidates1.length; i1++) {
		for (var i2 = 0; i2 < candidates2.length; i2++) {
			if (candidates1[i1].category === candidates2[i2].category) {
				// console.log('Found common category ' + candidates2[i2].category.name, candidates1[i1].unit, candidates2[i2].unit);

				// Multiply by first unit factor
				value = this.apply(value, candidates1[i1].unit.value, false);
				// Divide by second unit factor
				value = this.apply(value, candidates2[i2].unit.value, true);
				return value;
			}
		}
	}
	throw Error('No conversion from ' + srcUnit + ' to ' + dstUnit);
};

Convertor.prototype.findCandidates = function(name) {
	var candidates = [], nameLC = name.toLowerCase();
	this.categories.forEach(function(category) {
		category.units.forEach(function(unit) {
			if (unit.name.toLowerCase() === nameLC // matches unit name
				|| (unit.symbol && unit.symbol === name)) // matches unit symbol
				candidates.push({ category: category, unit: unit });
		});
	});
	return candidates;
};

Convertor.prototype.startCategory = function(name) {
	this.category = { name: name, units: [] };
	this.categories.push(this.category);
};

Convertor.prototype.addUnit = function(name, value, symbol) {
	var unit = { name: name, value: value };
	if (symbol)
		unit.symbol = symbol;
	this.category.units.push(unit);
};

Convertor.prototype.addUnits = function(startValue, multiplier, units) {
	var parts = units.split(','), value = startValue, i;
	for (i = 0; i < parts.length; i += 2) {
		if (parts[i + 1] !== '')
			this.addUnit(parts[i + 1], value, parts[i]);
		value *= multiplier;
	}
};

Convertor.prototype.apply = function(value, conversion, invert) {
	var multiplier = 1, divider = 1, offset = 0;
	if (typeof conversion === 'number')
		return invert ? (value / conversion) : (value * conversion);
	multiplier = (typeof conversion.m !== 'undefined') ? conversion.m : 1;
	divider = (typeof conversion.d !== 'undefined') ? conversion.d : 1;
	offset = (typeof conversion.o !== 'undefined') ? conversion.o : 0;
	if (invert)
		return (value - offset) * divider / multiplier;
	return value * multiplier / divider + offset;
};

$(function() {
	var input = document.getElementById('calculator-content'),
		calculator = new Calculator();

	// Traduire si demandé le texte des boutons
	$('button').each(function(index, button) {
		var translation = language[$(button).text()];
		if (translation)
			button.innerHTML = translation;
	});

	function calculate() {
		var val, output;
		try {
			val = input.value;
			output = calculator.eval(val);
			input.value = output;
			setMessage(val, false);
		} catch (e) {
			setMessage(e.message, true);
		}
	}

	function insert(text) {
		var startIndex = input.selectionStart;
		var endIndex = input.selectionEnd;
		input.value = input.value.substring(0, startIndex) + text + input.value.substring(endIndex, input.value.length);
		input.selectionStart = startIndex + text.length;
		input.selectionEnd = input.selectionStart;
		input.focus();
	}

	function setMessage(text, isError) {
		$('#calculator-message').text(text || '');
		$(document.body).toggleClass('error', !!text && isError).toggleClass('success', !!text && !isError);
	}
	
	/* Les boutons qui ajoutent 1 caractère. Pour les opérateurs, on ajoute aussi des espaces autour */
	$(document.body).on('click', 'button.syntax, button.numeric', function(event) {
		var button = $(event.target);
		insert(button.attr('data-content') || button.text());
	}).on('click', 'button.operator', function(event) {
		insert(' ' + $(event.target).text() + ' ');
	}).on('click', 'button.function', function(event) {
		var button = $(event.target),
			name = button.attr('data-function') || button.text(),
			f = calculator.functions[name];
		insert(name + '(' + f.arguments + ')');
	});

	/* Le bouton qui effectue le calcul */
	$('#calculator-keyboard .execute').click(function() {
		calculate();
	});
	/* Une autre manière de lancer le calcul = appuyer sur "entrée" */
	$(input).on('keypress', function(event) {
		if ((event.keyCode || event.which) === 13)
			calculate();
	});

	/* Le bouton qui ouvre/ferme la partie à droite */
	$('#calculator-keyboard .help').click(function() {
		$('body').toggleClass('help');
	});

	/* Le bouton qui vide le texte */
	$('#calculator-keyboard .clear').click(function() {
		input.value = '';
		setMessage('', false);
	});

	/* Le bouton qui retire le dernier caractère */
	$('#calculator-keyboard .delete').click(function() {
		if (input.value && input.value.length > 0) {
			var startIndex = input.selectionStart;
			var endIndex = input.selectionEnd;
			if (startIndex === endIndex) {
				input.value = input.value.substring(0, startIndex - 1) + input.value.substring(endIndex, input.value.length);
				input.selectionStart = startIndex - 1;
			} else {
				input.value = input.value.substring(0, startIndex) + input.value.substring(endIndex, input.value.length);
				input.selectionStart = startIndex;
			}
			input.selectionEnd = input.selectionStart;
			input.focus();
		}
	});

	/* Le bouton d'inversion du signe */
	$('#calculator-keyboard .sign').click(function() {
		var val = input.value;
		if (val && val.charAt(0) === '-')
			input.value = val.substring(1);
		else if (val.charAt(0) === '+')
			input.value = '-' + val.substring(1);
		else
			input.value = '-' + val;
	});

	/* Le bouton du séparateur décimal */
	$('#calculator-keyboard .decimal').click(function() {
		if (input.selectionStart > 0) {
			var val = input.value;
			var c = val.charAt(input.selectionStart - 1);
			if (c >= '0' && c <= '9')
				insert('.');
		}
	});

	/* En tappant sur la dernière formule, on la recharge dans la zone d'édition */
	$('#calculator-message').click(function(event) {
		if ($(document.body).hasClass('success'))
			input.value = $(event.target).text();
	});

	// Récupérer les taux de change
	// Taux : http://www.ecb.europa.eu/stats/eurofxref/eurofxref-daily.xml
	// Noms : http://www.ecb.europa.eu/stats/exchange/eurofxref/html/index.en.html
	$.get('https://techgp.fr:9001/utils/money/rates', function(data) {
		// console.log(data)
		Convertor.prototype.moneyRates = data;
	});

});