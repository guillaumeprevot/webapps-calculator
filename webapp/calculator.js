/**
 * A literal is a token, associated with a value (for instance : "true", "false", "null", "pi", "e"... ").
 *
 * Example for "true" literal : new CalculatorLiteral('true', true)
 *
 * @param {String} token - the token, as seen in formula
 * @param {*} value - the corresponding value, used to evaluate the result
 */
function CalculatorLiteral(token, value) {
	this.token = token;
	this.value = value;
}

/**
 * A function is a token (its name), followed by arguments separated with a ',' and enclosed between parenthesis. For instance, "min(a, b)" is :
 *
 * Example for "min" function : new CalculatorFunction("min", "a, b", function(context, a, b) { return Math.min(context.eval(a), context.eval(b)); })
 *
 * @param {String} token - the token, as seen in formula
 * @param {String} params - an optional description of parameters (not used directly in parser)
 * @param {Function} calculate - the function, used to evaluate the result. First parameter of the fonction is the context, with a "eval" helper method.
 */
function CalculatorFunction(token, params, calculate) {
	this.token = token;
	this.params = params;
	this.calculate = calculate;
}

/**
 * An operator is a token used to transforme a value (unary) or to combine two values (binary) :
 * - ! (logical not) is a prefix unary operator (i.e. !true === false)
 * - ² (square) is a postfix unary operator (i.e. 2² === 4)
 * - - (substract) is usually a binary left-associative operator (i.e. 3-2-1 === (3-2)-1) but is also an unary operator
 * - ** (exponentiation) is a binary right-associative operator (i.e. 2^2^3 === 2^(2^3))
 *
 * Example : new CalculatorOperator("-", 10, 'left', function(context, a, b) { return context.eval(a) - context.eval(b); })
 * 
 * @param {String} token - the token, as seen in formula
 * @param {Number} precedence - the precedence of the operator (multiplication has greater precedence over addition)
 * @param {String} associativity - how to apply operator (can be "left" or "right" for binary operators and "prefix" or "postfix" for unary operators)
 * @param {Function} calculate - the function, with 3 parameters (context, a, b), with b being absent for unary operators
 */
function CalculatorOperator(token, precedence, associativity, calculate) {
	this.token = token;
	this.precedence = precedence;
	this.associativity = associativity;
	this.calculate = calculate;
}

/**
 * A parsing error, providing information about original formula, parsing position and message.
 *
 * @param {String} formula - the formula where error occured
 * @param {Number} index - the position in the formula where error occured
 * @param {String} message - the error message, that may contain parameters %0, %1, ...
 * @param {Array} params - the array of parameters, used to format
 */
function CalculatorError(formula, index, message, params) {
	this.formula = formula;
	this.index = index;
	this.message = message;
	this.params = params;
}

CalculatorError.prototype.console = function() {
	// Show formula on console
	console.log(this.formula);
	// Show error index in formula with ^
	console.log(' '.repeat(this.index) + '^');
};

CalculatorError.prototype.format = function(lang) {
	var s = lang(this.message);
	if (this.params) {
		for (var i = 0; i < this.params.length; i++) {
			s = s.replace('%' + i, this.params[i]);
		}
	}
	return s;
};

/**
 * The calculator combines the grammar (~syntax) and the parser (parse/format/eval)
 *
 * @member {Map} literals - the map from token to literals accepted in the grammar
 * @member {Map} functions - the map from function's name to function accepted in the grammar
 * @member {Map} prefixOperators - the map from operator's token to prefix operator accepted in the grammar
 * @member {Map} postfixOperators - the map from operator's token to postfix operator accepted in the grammar
 * @member {Map} binaryOperators - the map from operator's token to binary operator accepted in the grammar
 *
 * @member {String} formula - the formula to parse
 * @member {Number} index - the current position during parsing, from 0 to formula.length
 * @member {Array} separators - a compact list of token separators, build from grammar to optimize parsing
 */
function Calculator() {
	this.literals = {};
	this.functions = {};
	this.prefixOperators = {};
	this.postfixOperators = {};
	this.binaryOperators = {};	
	this.formula = undefined;
	this.index = undefined;
	this.separators = undefined;
}

/**
 * Helper method to add a literal from a token and a value.
 *
 * @see CalculatorLiteral
 */
Calculator.prototype.addLiteral = function(token, value) {
	this.literals[token.toLowerCase()] = new CalculatorLiteral(token, value);
};

/**
 * Helper method to add default literals true, false, null, pi.
 *
 * @param {Function(String)->String} lang - a function to allow translation
 */
Calculator.prototype.addDefaultLiterals = function(lang) {
	var calculator = this;
	function add(token, value) {
		calculator.addLiteral(lang(token), value);	
	};
	add('true', true);
	add('false', false);
	add('null', null);
	add('pi', Math.PI);
	add('e', Math.E);
};

/**
 * Helper method to add a function from a token, a description of parameters and a function used for evaluation.
 *
 * @see CalculatorFunction
 */
Calculator.prototype.addFunction = function(token, params, calculate) {
	this.functions[token.toLowerCase()] = new CalculatorFunction(token, params, calculate);
};

/**
 * Helper method to add default functions from javascript Math object, and an "if" function working like ".. ? ... : ..." opérator.
 *
 * @param {Function(String)->String} lang - a function to allow translation
 */
Calculator.prototype.addDefaultFunctions = function(lang) {
	var calculator = this;
	function addFromMath(token, params) {
		calculator.addFunction(lang(token), params || '', function(context) {
			// Evaluate all "arguments" after "context" and store values in "params"
			var params = [];
			for (var i = 1; i < arguments.length; i++) {
				params.push(context.eval(arguments[i]));
			}
			// Call Math function with evaluated values
			return Math[token].apply(Math, params);
		});
	}

	'random'.split(',').forEach(function(token) { addFromMath(token); });
	'abs,cos,sin,tan,acos,asin,atan,ceil,floor,round,exp,log,sqrt'.split(',').forEach(function(token) { addFromMath(token, 'x'); });
	'pow,atan2'.split(',').forEach(function(token) { addFromMath(token, 'x, y'); });
	'min,max'.split(',').forEach(function(token) { addFromMath(token, 'x, y*'); });

	calculator.addFunction(lang('cbrt'), lang('x'), function(context, x) { return (x < 0 ? -1 : 1) * Math.pow(Math.abs(context.eval(x)), 1/3); });
	calculator.addFunction(lang('if'), lang('test, trueValue, falseValue'), function(context, t, v1, v2) { return context.eval(t) ? context.eval(v1) : context.eval(v2); });
};

/**
 * Helper method to add -in the appropriate map- an operator from a token, a precedence, an associativity and a function used for evaluation.
 *
 * @see CalculatorOperator
 */
Calculator.prototype.addOperator = function(token, precedence, associativity, calculate) {
	// Some tokens may be prefix, postfix and/or binary. For instance : "++" is prefix or postfix and "-" is prefix or binary
	// To avoid naming conflict, operators are stored internally in three different maps.
	var operators = ('prefix' === associativity) ? this.prefixOperators : ('postfix' === associativity) ? this.postfixOperators : this.binaryOperators;
	operators[token.toLowerCase()] = new CalculatorOperator(token, precedence, associativity, calculate);
};

/**
 * Helper method to add default operators.
 *
 * @param {Function(String)->String} lang - a function to allow translation
 */
Calculator.prototype.addDefaultOperators = function(lang) {
	// Javascript : https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Operators/Operator_Precedence
	// Java : https://docs.oracle.com/javase/tutorial/java/nutsandbolts/operators.html
	var calculator = this;
	var precedence = 15;
	function add(token, associativity, calculate) {
		calculator.addOperator(lang(token), precedence, associativity, calculate);
	}

	// add('.', 'left', function(context, a, b) { return context.eval(a)[context.eval(b)]; }); // member access
	precedence--;
	add('²', 'postfix', function(context, a) { return Math.pow(context.eval(a), 2); });
	add('³', 'postfix', function(context, a) { return Math.pow(context.eval(a), 3); });
	add('++', 'postfix', function(context, variable) { return variable.value++; });
	add('--', 'postfix', function(context, variable) { return variable.value--; });
	add('!', 'postfix', function(context, a) { var result = 1; var v = Math.round(context.eval(a)); while (v !== 0) result *= v--; return result; }); // factorielle
	precedence--;
	add('√', 'prefix', function(context, a) { return Math.sqrt(context.eval(a)); });
	add('!', 'prefix', function(context, a) { return !context.eval(a); }); // logical not
	add('~', 'prefix', function(context, a) { return ~context.eval(a); }); // bitwise not
	add('+', 'prefix', function(context, a) { return +context.eval(a); });
	add('-', 'prefix', function(context, a) { return -context.eval(a); });
	add('++', 'prefix', function(context, variable) { return ++variable.value; });
	add('--', 'prefix', function(context, variable) { return --variable.value; });
	precedence--;
	add('**', 'right', function(context, a, b) { return Math.pow(context.eval(a), context.eval(b)); });
	add('*', 'left', function(context, a, b) { return context.eval(a) * context.eval(b); }); // &#x00D7;
	add('/', 'left', function(context, a, b) { return context.eval(a) / context.eval(b); }); // &#x00F7;
	add('%', 'left', function(context, a, b) { return context.eval(a) % context.eval(b); });
	precedence--;
	add('+', 'left', function(context, a, b) { return context.eval(a) + context.eval(b); }); // number addition and string concatenation
	add('-', 'left', function(context, a, b) { return context.eval(a) - context.eval(b); });
	precedence--;
	add('<<', 'left', function(context, a, b) { return context.eval(a) << context.eval(b); });
	add('>>', 'left', function(context, a, b) { return context.eval(a) >> context.eval(b); });
	add('>>>', 'left', function(context, a, b) { return context.eval(a) >>> context.eval(b); });
	precedence--;
	add('<', 'left', function(context, a, b) { return context.eval(a) < context.eval(b); });
	add('>', 'left', function(context, a, b) { return context.eval(a) > context.eval(b); });
	add('<=', 'left', function(context, a, b) { return context.eval(a) <= context.eval(b); }); // &#x2264;
	add('>=', 'left', function(context, a, b) { return context.eval(a) >= context.eval(b); }); // &#x2265;
	add('in', 'left', function(context, a, b) { return context.eval(b).indexOf(context.eval(a)) >= 0; });
	// instanceof
	precedence--;
	add('===', 'left', function(context, a, b) { return context.eval(a) === context.eval(b); });
	add('!==', 'left', function(context, a, b) { return context.eval(a) !== context.eval(b); });
	add('==', 'left', function(context, a, b) { return context.eval(a) == context.eval(b); });
	add('!=', 'left', function(context, a, b) { return context.eval(a) != context.eval(b); }); // &#x2260;
	precedence--;
	add('&', 'left', function(context, a, b) { return context.eval(a) & context.eval(b); }); // bitwise AND
	precedence--;
	add('^', 'left', function(context, a, b) { return context.eval(a) ^ context.eval(b); }); // bitwise XOR
	precedence--;
	add('|', 'left', function(context, a, b) { return context.eval(a) | context.eval(b); }); // bitwise OR
	precedence--;
	add('&&', 'left', function(context, a, b) { return context.eval(a) && context.eval(b); });
	precedence--;
	add('||', 'left', function(context, a, b) { return context.eval(a) || context.eval(b); });
	precedence--;
	// ? :
	precedence--;
	add('=', 'right', function(context, variable, b) { return variable.value = context.eval(b); }); // affectation
	// += -= **= *= /= %= <<= >>= >>>= &= ^= |=
	precedence--;
	// "," is also used to parse function parameters (between "(" and ")") or array elements (between "[" and "]")
	add(',', 'left', function(context, a, b) { return context.eval(a).concat ? context.eval(a).concat(context.eval(b)) : [context.eval(a), context.eval(b)]; });
};

/**
 * This method tries to parse a formula into an abstract syntax tree (AST).
 * Then, you can use "format" or "eval" methods, passing them the "parse" result AST.
 *
 * @param {String} formula - the formula to parse
 */
Calculator.prototype.parse = function(formula) {
	this.formula = formula.trim();
	this.index = 0;
	this.separators = ['(', ')', '[', ']', ' '];
	for (var p in this.prefixOperators) {
		this.separators.push(p);
	}
	for (var p in this.postfixOperators) {
		this.separators.push(p);
	}
	for (var p in this.binaryOperators) {
		this.separators.push(p);
	}
	return this.eParser();
};

/**
 * This method formats an AST (like the one extracted by "parse") into a string. For instance, you can reformat a formula using :
 *
 * <code>
 * var formula = "1+  2 ²"
 * var ast = calculator.parse(formula);
 * console.log(calculator.format(ast)); // "1 + 2²"
 * </code>
 *
 * @param {Object} tree - the tree to format into a string
 */
Calculator.prototype.format = function(tree) {
	switch (tree.type) {
		case 'literal': // 1, 123.45, true, null, pi, ...
			return tree.token || tree.value;
		case 'array': // [ params ]
			return '[' + tree.params.map(this.format.bind(this)).join(', ') + ']';
		case 'grouping': // ( left )
			return '(' + this.format(tree.left) + ')';
		case 'binary': // left token right
			return this.format(tree.left) + ' ' + tree.token + ' ' + this.format(tree.right);
		case 'prefix': // token right
			return tree.token + this.format(tree.right);
		case 'postfix': // left token
			return this.format(tree.left) + tree.token;
		case 'function': // token ( params )
			return tree.token + '(' + tree.params.map(this.format.bind(this)).join(', ') + ')';
	};
	throw Error('Invalid tree node type ' + tree.type, tree);
};

/**
 * This method calculates the value of an AST (like the one extracted by "parse"). For instance :
 *
 * <code>
 * var formula = "1+  2 ²"
 * var ast = calculator.parse(formula);
 * var value = calculator.eval(ast);
 * console.log(value, typeof value); // 5, number
 * </code>
 *
 * @param {Object} tree - the tree to evaluate
 */
Calculator.prototype.eval = function(tree) {
	switch (tree.type) {
		case 'literal': // 1, 123.45, true, null, pi, ...
			return (typeof tree.value !== 'undefined') ? tree.value : this.literals[tree.token].value;
		case 'array': // [ params ]
			return tree.params.map(this.eval.bind(this));
		case 'grouping': // ( ... )
			return this.eval(tree.left);
		case 'binary': // left token right
			return this.binaryOperators[tree.token].calculate(this, tree.left, tree.right);
		case 'prefix': // token right
			return this.prefixOperators[tree.token].calculate(this, tree.right);
		case 'postfix': // left token
			return this.postfixOperators[tree.token].calculate(this, tree.left);
		case 'function': // token ( params )
			return this.functions[tree.token].calculate.apply(null, [this].concat(tree.params));
	};
	throw Error('Invalid tree node type ' + tree.type, tree);
};

/** stops the parsing process and reports an error. */
Calculator.prototype.error = function(message, params) {
	// Stop algorithm
	throw new CalculatorError(this.formula, this.index, message, params);
};

/** returns the next token of input or special marker "end" to represent that there are no more input tokens. "next" does not alter the input stream. */
Calculator.prototype.next = function() {
	// Parsing after string end throws an error
	if (this.index > this.formula.length)
		this.error('End of formula has been reached');
	// The last token when the string is over is an empty token
	if (this.index === this.formula.length)
		return '';
	// Check if a string starts at current position
	if (this.formula[this.index] === '"') {
		// In that case, find the next closing quote
		var previous = '';
		var i = this.index + 1; 
		while (i < this.formula.length
				&& (this.formula[i] !== '"' || previous === '\\')) { // skip despecialized quotes
			previous = this.formula[i];
			i++;
		}
		if (i === this.formula.length)
			this.error('Un-terminated string started at position %0', [this.index]);
		// Found a string
		return this.formula.substring(this.index, i + 1);
	}
	// Search the next occurence of each separators
	var index = -1, length = 0;
	for (var i = 0; i < this.separators.length; i++) {
		var p = this.formula.indexOf(this.separators[i], this.index);
		if (p >= 0) {
			if (index === -1 || index > p) {
				index = p;
				length = this.separators[i].length;
			} else if (index === p) {
				length = Math.max(length, this.separators[i].length);
			}
		}
	}
	// found a token ending stream
	if (index === -1)
		return this.formula.substring(this.index);
	// found a separator at current position
	if (index === this.index)
		return this.formula.substr(this.index, length);
	// found a token from this current position to the next separator
	return this.formula.substring(this.index, index).trim();
};

/** reads one token. When "next=end", consume is still allowed, but has no effect. */
Calculator.prototype.consume = function(text) {
	// Get next token to consume, or use text if provided as optimisation
	// In fact, this.next() is never called because each call to 'consume' already knowns what is the next token (= "text" argument)
	var s = text || this.next();
	// Move forward
	this.index += s.length;
	// And skip following spaces
	while (this.index < this.formula.length && this.formula[this.index] === ' ')
		this.index++;
};

/** if next = text then consume else error */
Calculator.prototype.expect = function(text) {
	// Get next token 
	var s = this.next();
	// Check if this token matches expected text
	if (s === text)
		// OK, consume token
		this.consume(s);
	else
		// Error, the next token is unexpected
		this.error('Found "%1" but expecting "%2" at position %0', [this.index, s, text]);
};

/**
 * La fonction retourne un arbre représentant l'interprétation de la formule.
 * 
 * Il y a différents types de noeuds :
 * - literal(token, value) : une valeur finale (feuille de l'arbre)
 * - array(params) : un tableau de valeurs entourées de [ et ] et séparées par ','
 * - grouping(left) : un expression entourée de ( et )
 * - binary(token, left, right) : un opérateur binaire avec la partie gauche et la partie droite
 * - prefix(right) : un opérateur unaire préfixe, avec la valeur à droite
 * - postfix(left) : un opérateur unaire postfixe, avec la valeur à gauche
 * - function(token, params) : une fonction dont token est le nom et params la liste des paramètres 
 */
Calculator.prototype.eParser = function() {
	// Try to get the Abstract Syntax Tree (AST) for the expression starting at position 0
	var tree = this.Exp(0);
	// Ensure that the end of the formula is reached, like expected
	this.expect('');
	// Return the AST
	return tree;
};

Calculator.prototype.Exp = function(p) {
	// An expression at precedence "p" is a primary value (meaning "everything except an operator")
	var tree = this.Primary();
	// Get the next token
	var token = this.next().toLowerCase();
	// Check if the next token is a binary operator with expected minimum precedence
	while (this.binaryOperators.hasOwnProperty(token) && this.binaryOperators[token].precedence >= p) {
		var op = this.binaryOperators[token];
		this.consume(token);
		// "q" is the accepted precedence for an operator on the right side of the binary operator "token"
		// This is where the precedence of operator matters !
		var q = op.associativity === 'left' ? op.precedence + 1 : op.precedence;
		// Get the right part of the binary operator "token"
		var right = this.Exp(q);
		// Create a "binary" AST node
		tree = {
			type: 'binary',
			token: token,
			left: tree, // a primary in the first loop, a binary after that
			right: right
		};
		// And check if the next token is also a binary operator
		token = this.next().toLowerCase();
	}
	return tree;
};

Calculator.prototype.Primary = function() {
	// Get next token
	var token = this.next();
	if (this.prefixOperators.hasOwnProperty(token.toLowerCase())) {
		// If token is a prefix operator : consume it, get right part expresion and we are done
		var op = this.prefixOperators[token.toLowerCase()];
		this.consume(token);
		var q = op.precedence;
		var right = this.Exp(q);
		return {
			type: 'prefix',
			token: token.toLowerCase(),
			right: right
		};
	} else if ('(' === token) {
		// If token is a '(' : consume it, get a single grouped expression and we should find the closing ')'
		this.consume(token);
		var t = this.Exp(0);
		this.expect(')');
		return {
			type: 'grouping',
			left: t
		};
	} else if ('[' === token) {
		// If token is a '[' : consume it, get a multiple expressions array and we should find the closing ']'
		this.consume(token);
		var t = this.Array('array');
		this.expect(']');
		return t;
	} else if (this.functions.hasOwnProperty(token.toLowerCase())) {
		// If the token is a function's name : consume it and get parameters between '(' and ')'
		var f = this.functions[token.toLowerCase()];
		this.consume(token);
		this.expect('(');
		var t = this.Array('function');
		this.expect(')');
		t.token = token.toLowerCase();
		return t;
	} else {
		// Finally, the token should be a literal : consume it and check if it is followed by one or more postfix operators
		var left = this.Literal(token);
		this.consume(token);
		token = this.next().toLowerCase();
		while (this.postfixOperators.hasOwnProperty(token)) {
			var op = this.postfixOperators[token];
			this.consume(token);
			left = {
				type: 'postfix',
				token: token,
				left: left
			};
			token = this.next().toLowerCase();
		}
		return left;
	}
};

Calculator.prototype.Array = function(type) {
	// array (true, 1, 2) will be represented in t as binary(binary(literal(true), literal(1)), literal(2))
	var t = this.Exp(0);
	// params will flatten the array into [literal(true), literal(1), literal(2)]
	var params = [];
	function add(tree) {
		if (tree.type === 'binary' && tree.token === ',') {
			add(tree.left);
			params.push(tree.right);
		} else {
			params.push(tree);
		}
	}
	// start loop
	add(t);
	return {
		type: type,
		params: params
	};
};

Calculator.prototype.Literal = function(token) {
	var tokenLC = token.toLowerCase();

	function build(value, t) {
		return {
			type: 'literal',
			token: t || token,
			value: value
		};
	}

	// Throw error if the token is a function name
	if (this.functions.hasOwnProperty(tokenLC) || this.separators.indexOf(tokenLC) >= 0)
		this.error('Expecting a value but found "%1" at position %0', [this.index, token]);

	// Predefined literal like null, false, true, pi, ...
	if (this.literals.hasOwnProperty(tokenLC))
		return build(undefined, tokenLC);
	// string support
	if (token.length >= 2 && token[0] === '"' && token[token.length - 1] === '"')
		return build(token.substring(1, token.length - 1).replace('\\"', '"'));
	// integer in hexadecimal format support
	if (token.match(/0x[0-9a-fA-F]+/))
		return build(parseInt(token.substring(2), 16));
	// integer in octal format support
	if (token.match(/0o[0-7]+/))
		return build(parseInt(token.substring(2), 8));
	// integer in binary format support
	if (token.match(/0b[0-1]+/))
		return build(parseInt(token.substring(2), 2));
	// float in decimal format support
	if (token.match(/\d+\.\d+/))
		return build(parseFloat(token));
	// integer in decimal format support
	if (token.match(/\d+/))
		return build(parseInt(token));
	// Unsupported literal
	this.error('Expecting a value but found "%1" at position %0', [this.index, token]);
};
