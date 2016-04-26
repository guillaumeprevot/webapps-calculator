function Calculator() {
	this.binaryOperators = {};
	this.createBinaryOperators().forEach((function(value, index, all) {
		jsep.addBinaryOp(value.name, all.length - index);
		this.binaryOperators[value.name] = value;
	}).bind(this));
	this.unaryOperators = {};
	this.createUnaryOperators().forEach((function(value, index, all) {
		jsep.addUnaryOp(value.name);
		this.unaryOperators[value.name] = value;
	}).bind(this));
	this.functions = {};
	this.createFunctions().forEach((function(value, index, all) {
		this.functions[value.name] = value;
	}).bind(this));
};

Calculator.prototype.createBinaryOperators = function() {
	var operators = [];
	operators.push({ name: '^', calculate: function(a, b) { return Math.pow(a, b); }});
	operators.push({ name: '*', calculate: function(a, b) { return a * b; }});
	operators.push({ name: '/', calculate: function(a, b) { return a / b; }});
	operators.push({ name: '%', calculate: function(a, b) { return a % b; }});
	operators.push({ name: '+', calculate: function(a, b) { return a + b; }});
	operators.push({ name: '-', calculate: function(a, b) { return a - b; }});
	operators.push({ name: '<<', calculate: function(a, b) { return a << b; }});
	operators.push({ name: '>>', calculate: function(a, b) { return a >> b; }});
	operators.push({ name: '>>>', calculate: function(a, b) { return a >>> b; }});
	operators.push({ name: '<', calculate: function(a, b) { return a < b; }});
	operators.push({ name: '>', calculate: function(a, b) { return a > b; }});
	operators.push({ name: '<=', calculate: function(a, b) { return a <= b; }});
	operators.push({ name: '>=', calculate: function(a, b) { return a >= b; }});
	operators.push({ name: '===', calculate: function(a, b) { return a === b; }});
	operators.push({ name: '!==', calculate: function(a, b) { return a !== b; }});
	operators.push({ name: '=', calculate: function(a, b) { return a == b; }});
	operators.push({ name: '==', calculate: function(a, b) { return a == b; }});
	operators.push({ name: '<>', calculate: function(a, b) { return a != b; }});
	operators.push({ name: '!=', calculate: function(a, b) { return a != b; }});
	operators.push({ name: '&', calculate: function(a, b) { return a & b; }});
	operators.push({ name: '|', calculate: function(a, b) { return a | b; }});
	operators.push({ name: 'xor', calculate: function(a, b) { return a ^ b; }});
	operators.push({ name: '&&', calculate: function(a, b) { return a && b; }});
	operators.push({ name: 'and', calculate: function(a, b) { return a && b; }});
	operators.push({ name: '||', calculate: function(a, b) { return a || b; }});
	operators.push({ name: 'or', calculate: function(a, b) { return a || b; }});
	return operators;
};

Calculator.prototype.createUnaryOperators = function() {
	var operators = [];
	operators.push({ name: '+', calculate: function(a) { return a; }});
	operators.push({ name: '-', calculate: function(a) { return -a; }});
	operators.push({ name: '!', calculate: function(a) { return !a; }});
	operators.push({ name: '²', calculate: function(a) { return Math.pow(a, 2); }});
	operators.push({ name: '√', calculate: function(a) { return Math.sqrt(a); }});
	operators.push({ name: '~', calculate: function(a) { return ~a; }});
	return operators;
};

Calculator.prototype.createFunctions = function() {
	var functions = [];
	'random'.split(',').forEach(function(name, index) {
		functions.push({ name: name, arguments: '', calculate: Math[name]});
	});
	'abs,cos,sin,tan,acos,asin,atan,ceil,floor,round,exp,log,sqrt'.split(',').forEach(function(name, index) {
		functions.push({ name: name, arguments: 'x', calculate: Math[name]});
	});
	'pow'.split(',').forEach(function(name, index) {
		functions.push({ name: name, arguments: 'x, n', calculate: Math[name]});
	});
	'min,max'.split(',').forEach(function(name, index) {
		functions.push({ name: name, arguments: 'x, y*', calculate: Math[name]});
	});
	functions.push({ name: 'if', arguments: 'test, trueValue, falseValue', calculate: function(t, v1, v2) { return t ? v1 : v2; }});
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

$(function() {
	var input = document.getElementById('calculator-content'),
		calculator = new Calculator();

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

});