var languages = {
	'fr': {
		'in': 'dans',
		'&&': 'et',
		'||': 'ou',
		'sqrt': 'racine',
		'pow': 'puissance',
		'if': 'si',
		'test, trueValue, falseValue': 'test, valeurVrai, valeurFaux',
		'convert': 'convertir',
		'1, \'srcUnit\', \'dstUnit\'': '1, \'de\', \'vers\'',
		'Money': 'Monétaire',
		'End of formula has been reached': 'La fin de la formule a été atteinte',
		'Un-terminated string started at position %0': 'Chaine non terminée commencée à la position %0',
		'Found "%1" but expecting "%2" at position %0': '"%1" trouvé mais "%2" attendu à la position %0',
		'Expecting a value but found "%1" at position %0': '"%1" trouvé mais une valeur était attendue à la position %0',
	},
	'en': {
		'&&': 'and',
		'||': 'or',
		'convert': 'conv',
		'random': 'rand',
	}
};

var language = (typeof languages[navigator.language] !== 'undefined') ? languages[navigator.language] : languages['en'];

function lang(text) {
	return language[text] || text;
}

function Converter() {
	this.categories = [];

	this.startCategory('Accélération', 'Vitesse_et_acc.C3.A9l.C3.A9ration');
	this.addUnit('mètre par seconde carrée', 1, 'm/s²');
	this.addUnit('gravité', 9.80665, 'g');
	this.addUnit('gal', 0.01, 'Gal', 'galileo');

	this.startCategory('Angle', 'Angle');
	this.addUnit('degré', 1, '°', 'deg', 'degree');
	this.addUnit('grade', 0.9, 'gr', 'gon', 'gradian'); // 1/100 d'angle droit
	this.addUnit('radian', 360 / (2 * Math.PI), 'rad');
	this.addUnit('signe', 30, '', 'sign');
	this.addUnit('octant', 45, '');
	this.addUnit('sextant', 60, '');
	this.addUnit('quadrant', 90, '', 'angle droit');
	this.addUnit('révolution', 360, '', 'tour');
	this.addUnit('minute angulaire', { d: 60 }, '′'); // ou arcminute ou Minute d'arc
	this.addUnit('seconde angulaire', { d: 3600 }, '″'); // ou arcseconde ou Seconde d'arc

	this.startCategory('Charge', '.C3.89lectricit.C3.A9');
	this.addUnit('ampère heure', 1000, 'Ah');
	this.addUnit('milliampère heure', 1, 'mAh');
	this.addUnit('coulomb', { m: 1000, d: 3600 }, 'C'); // 1 As

	this.startCategory('Energie', '.C3.89nergie');
	this.addUnit('calorie', 4.1868, 'cal'); // calorie
	this.addUnit('kilocalorie', 4186.8, 'kcal'); // kilocalorie
	this.addUnit('thermie', 4186800, 'th'); // Mégacalorie
	this.addUnit('joule', 1, 'J', 'newton-meter'); // joule
	this.addUnit('kilojoule', 1000, 'kJ'); // kilojoule
	this.addUnit('watt heure', 3600, 'Wh'); // watt-hour
	this.addUnit('kilowatt heure', 3600000, 'kWh'); // kilowatt-hour
	this.addUnit('électron-volt', 1.6021765e-19, 'eV'); // electronvolt
	this.addUnit('pied-livre', 1.3558179483314, 'lb ft'); // pound force-foot
	this.addUnit('pouce-livre', 0.112984829027617, 'lb in'); // pound force-inch
	this.addUnit('unité thermale britannique', 1057, 'btu'); // British Thermal Unit
	this.addUnit('chevaux-vapeur heure', 2684519.53769617, 'hp hr'); // hoursepower hour
	this.addUnit('tonne TNT', 4.184e9, ''); // wikipedia FR explique pourquoi 4.184 et pas 4.6
	this.addUnit('Hiroshima', 15000 * 4.184e9, 'Little Boy'); // 15 000 tonnes TNT
	this.addUnit('Nagasaki', 22000 * 4.184e9, 'Fat Man'); // 21 à 23 000 tonnes TNT
	this.addUnit('erg', 1e-7, '');

	this.startCategory('Force', 'Force');
	this.addUnit('newton', 1, 'N'); // 1 kg.m/s2
	this.addUnit('dyne', 1e-5, 'dyn');
	this.addUnit('sthène', 1000, 'sn');
	this.addUnit('gramme-force', 9.80665e-3, 'gf', 'gravet'); // 1 g.gn
	this.addUnit('kilogramme-force', 9.80665, 'kgf', 'kilopond'); // 1 kg.gn
	this.addUnit('ounce-force', 0.2780138509537812, 'ozf'); // 1 oz av × gn
	this.addUnit('pound-force', 4.4482216152605, 'lbf'); // 1 lb av × gn

	this.startCategory('Intensité lumineuse', 'Lumi.C3.A8re');
	this.addUnit('candela', 0.1, 'cd');
	this.addUnit('bougie', 1.018, '');
	this.addUnit('carcel', 9.8, '');

	this.startCategory('Longueur', 'Longueur');
	this.addUnits(1, 10, 'nm,nanomètre,,,,,μm,micromètre,,,,,mm,millimètre,cm,centimètre,dm,décimètre,m,mètre,dam,décamètre,hm,hectomètre,km,kilomètre,,,,,Mm,mégamètre');
	this.addUnit('ångström', 0.1, 'Å');
	this.addUnit('chaîne', 20116800000, ''); // 1000 liens
	this.addUnit('lien', 201168000, '');
	this.addUnit('main', 101600000, '', 'levée'); // 0.1016 mètre
	this.addUnit('micron', 1000, '');
	this.addUnit('mil (US)', 25400, '');
	this.addUnit('mille', 1609344000000, 'mi');
	this.addUnit('mille marin', 1852000000000, '');
	this.addUnit('parcours', 228600000, '');
	this.addUnit('perche', 5029200000, '');
	this.addUnit('pica', { m: 25400000, d: 6 }, ''); // 1/6 de pouce https://en.wikipedia.org/wiki/Pica_%28typography%29
	this.addUnit('toise', 1828800000, '', 'brasse'); // 6 pieds
	this.addUnit('aune', 1219200000, ''); // 4 pieds
	this.addUnit('yard', 914400000, 'yd'); // 3 pieds
	this.addUnit('verge', 914400000, 'vg'); // Verge = nom français de "yard"
	this.addUnit('pied', 304800000, 'ft'); // 12 pouces
	this.addUnit('pouce', 25400000, 'in');
	this.addUnit('micropouce', 25.4, 'μin');
	this.addUnit('année lumière', 9460730472580800000000000, 'al'); // 9 460 730 472 580,8 km
	this.addUnit('minute lumière', 17987547480000000000, ''); // 60 secondes lumière
	this.addUnit('seconde lumière', 299792458000000000, ''); // c = 299 792 458 m/s
	this.addUnit('parsec', { m: 149597870700000000000 * 648000, d: Math.PI }, 'pc'); // parallaxe-seconde, 648 000/π ua
	this.addUnit('kiloparsec', { m: 149597870700000000000 * 648000 * 1000, d: Math.PI }, '');
	this.addUnit('mégaparsec', { m: 149597870700000000000 * 648000 * 1000000, d: Math.PI }, '');
	this.addUnit('marathon', 42194988000000, ''); // 42.194988 km
	this.addUnit('terrain de football', 91440000000, '');  // 100 yard
	this.addUnit('unité astronomique', 149597870700000000000, 'ua'); // 149597870700 mètres

	this.startCategory('Masse', 'Masse');
	this.addUnits(1, 10, 'mg,milligramme,cg,centigramme,dg,décigramme,g,gramme,dag,décagramme,hg,hectogramme,kg,kilogramme,,,q,quintal,t,tonne');
	this.addUnit('carat', 200, 'ct');
	this.addUnit('livre', 453592.37, 'lb');
	this.addUnit('grain', 64.79891, 'gr'); // 1 / 7000 livre
	this.addUnit('pennyweight', 1555.17384, 'pwt'); // 24 grains
	this.addUnit('once', 28349.523125, 'oz');
	this.addUnit('stone', 6350293.18, 'st'); // 14 livres
	this.addUnit('tonne courte', 907184740, 'sh t'); // 2000 livres
	this.addUnit('tonne longue', 1016046908.8, 'ton'); // 2240 livres
	this.addUnit('quintal court', 45359237, 'sh cwt'); // short hundredweight cental = 100 lb av = 45,359 237 kg
	this.addUnit('quintal long', 50802345.44, 'long cwt'); // long hundredweight cental = 112 lb av = 50,802 345 44 kg
	this.addUnit('once romaine', 27264, 'uncia');
	this.addUnit('once troy', 31103.4768, 'oz t');
	this.addUnit('once avoirdupois', 28349.523125, 'oz av');
	this.addUnit('livre romaine', 12 * 27264, 'libra'); // 12 once romaine
	this.addUnit('livre troy', 373241.7216, 'lb t'); // 12 once troy
	this.addUnit('livre avoirdupois', 453592.37, 'lb av'); // 16 once avoirdupois
	this.addUnit('mine romaine', 16 * 27264, 'mina'); // 16 once romaine
	this.addUnit('masse solaire', 1.9884e36, ''); // 1.98855e30 kg sur wikipedia EN mais 1.9884e30 kg sur wikipedia FR
	this.addUnit('masse atomique', 1.660538921e-21, 'u', 'dalton', 'uma', 'Da'); // 1.660539040e−27 kg sur wikipedia EN mais 1.660538921e-27 kg sur wikipedia FR

	this.startCategory('Pression', 'Pression');
	this.addUnit('pascal', 1, 'Pa'); // 1 N/m²
	this.addUnit('barye', 0.1, 'ba'); // 1 dyn/cm2
	this.addUnit('bar', 100000, 'bar');
	this.addUnit('pièze', 1000, 'pz');
	this.addUnit('atmosphère', 101325, 'atm', 'atmosphere');
	this.addUnit('atmosphère technique', 98066, 'at', 'technical atmosphere');
	this.addUnit('livre par pied carré', 47.9, 'psf', 'pound per square foot'); // 1 lb av × gn / 1 sq ft

	this.startCategory('Puissance', 'Puissance');
	this.addUnit('watt', 1, 'W'); // = 1 J/s = 1 kg.m2.s-3
	this.addUnit('joule par seconde', 1, 'J.s-1');
	this.addUnit('newton-mètre par seconde', 1, 'N.m.s-1');
	this.addUnit('kilogramme mètre carré par seconde au cube', 1, 'kg.m2.s-3');
	this.addUnit('kilowatt', 1000, 'kW');
	this.addUnit('mégawatt', 1e6, 'MW');
	this.addUnit('gigawatt', 1e9, 'GW');
	this.addUnit('térawatt', 1e12, 'TW');
	this.addUnit('erg par seconde', 1e-7, ''); // 1 g.cm2.s-3

	this.startCategory('Surface', 'Superficie');
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

	this.startCategory('Température', 'Temp.C3.A9rature');
	this.addUnit('Celsius', { m: 1.8, o: 491.57 }, '°C');
	this.addUnit('Fahrenheit', { m: 1, o: 459.57 }, '°F');
	this.addUnit('Rankine', 1, 'R', '°Ra');
	this.addUnit('kelvin', 1.8, 'K');
	this.addUnit('Réaumur', { m: 2.25, o: 491.67 }, 'r', '°Ré');

	this.startCategory('Temps', 'Temps');
	this.addUnit('nanoseconde', 1e-9, 'ns');
	this.addUnit('microseconde', 1e-6, 'μs');
	this.addUnit('milliseconde', 1e-3, 'ms');
	this.addUnit('seconde', 1, 's');
	this.addUnit('minute', 60, 'min');
	this.addUnit('heure', 3600, 'h');
	this.addUnit('jour', 86400, 'j');
	this.addUnit('semaine', 604800, '');
	this.addUnit('mois', { m: 31556926.08, d: 12 }, ''); // 1/12 d'année
	this.addUnit('année', 31556926.08, ''); // 365.2422 jours
	this.addUnit('an', 31556926.08, '');
	this.addUnit('fortnight', 1209600, ''); // 14 jours
	this.addUnit('décennie', 315569260.8, '');
	this.addUnit('siècle', 3155692608, '');
	this.addUnit('millénaire', 31556926080, '');
	this.addUnit('Plank', 5.39106e-44, 'tP'); // 5.39106e-44 s

	this.startCategory('Vitesse', 'Vitesse_et_acc.C3.A9l.C3.A9ration');
	this.addUnit('mètre par seconde', 1, 'm/s');
	this.addUnit('kilomètre par heure', { m: 1000, d: 3600 }, 'km/h');
	this.addUnit('noeud', { m: 1852, d: 3600 }, 'nd'); // 1 M marin/h soit 1.852 km/h
	this.addUnit('mach', 340, 'Ma'); // soit 1 224 km.h-1

	this.startCategory('Volume', 'Volume_-_capacit.C3.A9');
	this.addUnits(1, 1000, 'mm3,millimètre cube,cm3,centimètre cube,dm3,décimètre cube,m3,mètre cube');
	this.addUnits(1000, 10, 'ml,millilitre,cl,centilitre,dl,décilitre,l,litre,,,hl,hectolitre');
	this.addUnit('gallon américain', 3785411.784, '');
	this.addUnit('gallon impérial', 4546090, ''); // gallon britannique
	this.addUnit('chopine française', 476073.0, '');
	this.addUnit('chopine américaine', 473176.473, '');
	this.addUnit('chopine anglaise', 568261.25, '');
	this.addUnit('once liquide américaine', 29573.5295625, 'fl oz'); // 1/128 de gallon américain
	this.addUnit('once liquide impériale', 28413.0625, ''); // (ou anglaise) 1/160 de gallon impérial
	this.addUnit('pinte américaine', 473176.473, 'pt');
	this.addUnit('pinte impériale', 568261.25 , '');
	this.addUnit('quart américain', 946352.946, 'qt');
	this.addUnit('quart impérial', 1136522.5 , '');
	this.addUnit('pouce cube', 16387.064, '');
	this.addUnit('pied cube', 28316846.592, '');
	this.addUnit('yard cube', 764554857.984, '');
	this.addUnit('cup', 236588.2365, '');
	this.addUnit('dram', 3696.7162, '');
	this.addUnit('drop', 64.8524, '');
	this.addUnit('minim américaine', 61.61152, '');
	this.addUnit('tablespoon', 14786.76478, 'tbs');
	this.addUnit('teaspoon', 4928.921594, 'tsp');

	this.startCategory('Money');
	this.addUnit('euro', 1, '€');
	if (this.moneyRates) {
		for (var currency in this.moneyRates) {
			var symbol = (currency === 'USD') ? '$' : (currency === 'GBP') ? '£' : ''; 
			this.addUnit(currency, 1 / this.moneyRates[currency], symbol);
		}
	}

}

Converter.prototype.convert = function(value, srcUnit, dstUnit) {
	if (typeof value === 'string') {
		var candidates = this.findCandidates(value);
		if (candidates.length > 0) {
			window.open('https://fr.wikipedia.org/wiki/Conversion_des_unit%C3%A9s' + '#' + candidates[0].category.anchor);
			throw Error('');
		} else {
			throw Error('Use convert(unit) or convert(quantity, srcUnit, dstUnit)');
		}
	}
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

Converter.prototype.findCandidates = function(name) {
	var candidates = [], nameLC = name.toLowerCase();
	this.categories.forEach(function(category) {
		category.units.forEach(function(unit) {
			if (unit.name === nameLC // matches unit name
				|| (unit.alternateNames && unit.alternateNames.indexOf(nameLC) >= 0) // matches one of alternate names
				|| (unit.symbol && unit.symbol === name)) // matches unit symbol
				candidates.push({ category: category, unit: unit });
		});
	});
	return candidates;
};

Converter.prototype.startCategory = function(name, anchor) {
	this.category = { name: lang(name), units: [] };
	if (anchor)
		this.category.anchor = anchor;
	this.categories.push(this.category);
};

Converter.prototype.addUnit = function(name, value, symbol) {
	var unit = { name: lang(name).toLowerCase(), value: value };
	if (symbol)
		unit.symbol = symbol;
	if (arguments.length > 3) {
		unit.alternateNames = [];
		for (var i = 3; i < arguments.length; i++) {
			unit.alternateNames.push(lang(arguments[i]).toLowerCase());
		}
	}
	this.category.units.push(unit);
};

Converter.prototype.addUnits = function(startValue, multiplier, units) {
	var parts = units.split(','), value = startValue, i;
	for (i = 0; i < parts.length; i += 2) {
		if (parts[i + 1] !== '')
			this.addUnit(parts[i + 1], value, parts[i]);
		value *= multiplier;
	}
};

Converter.prototype.apply = function(value, conversion, invert) {
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
	calculator.addDefaultLiterals(lang);
	calculator.addDefaultFunctions(lang);
	calculator.addDefaultOperators(lang);

	calculator.addFunction(lang('convert'), lang('1, "srcUnit", "dstUnit"'), function(context, n, u1, u2) {
		return new Converter().convert(context.eval(n), context.eval(u1), context.eval(u2));
	});

	// Traduire si demandé le texte des boutons
	$('button').each(function(index, button) {
		var translation = language[$(button).text()];
		if (translation)
			button.innerHTML = translation;
	});

	function calculate() {
		var val, tree, output;
		try {
			val = input.value;
			tree = calculator.parse(val);
			//console.log(calculator.format(tree), tree);
			output = calculator.eval(tree);
			// console.log(output);
			input.value = (output === null) ? 'null' : (typeof output === 'undefined') ? '' : output.toString();
			setMessage(val, false);
		} catch (e) {
			if (e.console) {
				e.console();
				e.select(input);
				setMessage(e.format(lang), true);
			} else {
				console.log(e);
				setMessage(e.message, true);
			}
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
		var button = $(event.target),
			op = button.attr('data-operator') || button.text();
		insert(' ' + op + ' ');
	}).on('click', 'button.function', function(event) {
		var button = $(event.target),
			name = button.attr('data-function') || button.text(),
			f = calculator.functions[name];
		insert(name + '(' + f.params + ')');
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
		var val = input.value.trim();
		if (val && val.charAt(0) === '-')
			input.value = val.substring(1);
		else if (val.charAt(0) === '+')
			input.value = '-' + val.substring(1);
		else
			input.value = '-' + val;
	});

	/* Le bouton d'inversion du signe */
	$('#calculator-keyboard .inverse').click(function() {
		// Pour savoir s'il faut ajouter  ou supprimer les "(" ")" en plus de "1/", on tente de parser
		var val = input.value, tree;
		try {
			tree = calculator.parse(val);
			// Si la formule est 1 / xxx
			if (tree.type === 'binary' && tree.token === '/' && tree.left.type === 'literal' && tree.left.value === 1) {
				// On ne gardera que xxx, en retirant les éventuelles parenthèses
				tree = (tree.right.type === 'grouping') ? tree.right.left : tree.right;
				// La nouvelle formule est reformattée correctement
				input.value = calculator.format(tree);
				return;
			}
			// Si la formule n'est pas 1 / xxx, il faudra inverser mais on vérifie déjà s'il faut des parenthèses
			if (tree.type === 'binary')
				input.value = '1/(' + calculator.format(tree) + ')';
			else
				input.value = '1/' + calculator.format(tree);
		} catch (e) {
			input.value = '1/(' + val + ')';
		}
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
	function getWithCache(url, cacheKey, cacheExpire, callback) {
		try {
			// Récupérer dans localStorage les données si présentes
			var value = localStorage.getItem(cacheKey);
			if (value) {
				// value est de la forme { time: ms, data: data }
				value = JSON.parse(value);
				// Si le cache n'est pas trop vieux, on l'utilise
				if (value.time && (new Date().getTime() - value.time) < 1000 * 60 * 60 * 24) {
					callback(value.data);
					return;
				}
			}
		} catch (e) {
			//
		}
		// Si le cache est vide, ou trop vieux, on obsolète (=exception), on récupère des donées à jour
		$.get(url, function(data) {
			// On traite les données
			callback(data);
			// On met à jour le cache
			localStorage.setItem(cacheKey, JSON.stringify({
				time: new Date().getTime(),
				data: data
			}));
		});
	}
	(typeof localStorage !== 'undefined') && getWithCache('https://techgp.fr:9001/utils/money/rates', 'utils-money-rates', 1000 * 60 * 60 * 24, function(data) {
		// console.log(data)
		Converter.prototype.moneyRates = data;
	});

});
