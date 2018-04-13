/**
 * Most of the time, calculators deal with numbers. But more complex calculators could support
 * numbers in hexadecimal, octal or even binary notation. Even more complex expressions could
 * use boolean, strings, date or times...
 *
 * A type support is registered in the parser to create a new way to parse/format values from/into tokens :
 * - the "boolean" type support understands 'true'/'false' as boolean values true/false
 * - the "null" type support understands 'null' as the null value
 * - the "integer" type support understands '0', '1', '2', '100', ... as their equivalent integer values
 * - the "decimal" type support understands '0.5' or '123.45' as their equivalent float values
 * - the "binary" type support understands '0b110' as 6 integer value
 * - the "octal" type support understands '0o110' as 72 integer value
 * - the "hexadecimal" type support understands '0x110' as 272 integer value
 * - the "string" type support understands '"toto"' (with quotes) as the string "toto"
 * - the "date" type support understands '"2018/04/13"' (with quotes) as the date 13th April 2018
 *
 * The list of type support is user-defined : some may use only integer, some may use different date format, ...
 *
 * @param {String} name - an internal name for the type support, to keep track of the input value (is the integer in decimal or octal format ?)
 * @param {Function} parse - a method receiving a token and returning either the corresponding value (if supported) or null (if unknown)
 * @param {Function} format - a method receiving a supported value (or null), and returning the corresponding token
 */
function CalculatorType(name, parse, format) {
	this.name = name;
	this.parse = parse;
	this.format = format;
}

/**
 * A literal is a token, associated with constants (like "pi" or "e") or variables (like "mem").
 *
 * Example for "pi" literal :
 * new CalculatorLiteral('pi', Math.PI);
 *
 * Example for "mem" variable :
 * var mem = 0;
 * new CalculatorLiteral('mem',
 *    function() { return mem; },
 *    function(newValue) { mem = newValue; }
 * );
 *
 * @param {String} token - the token, as seen in formula
 * @param {*} value - the corresponding value (or the getter for a variable), used to evaluate the result
 * @param {Function} setter - the setter, if provided, for a variable called "token"
 */
function CalculatorLiteral(token, value, setter) {
	this.token = token;
	if (typeof value === 'function') {
		Object.defineProperty(this, 'value', {
			get: value, // the getter
			set: setter, // the setter
			enumerable: true, // visible in "for ... in ..." and Object.keys()
			configurable: false // can not change and be deleted with "delete"
		});
	} else {
		this.value = value;
	}
}

/**
 * A function is a token (its name), followed by arguments separated with a ',' and enclosed between parenthesis. For instance, "min(a, b)" is :
 *
 * Example for "min" function :
 * new CalculatorFunction("min", "a, b", function(context, resolve, reject, a, b) {
 *   context.calculateAll([a, b], function(params) {
 *     resolve(Math.min(params[0], params[1]));
 *   }, reject);
 * })
 *
 * Example for "if" function :
 * new CalculatorFunction("if", "test, yes, no", function(context, resolve, reject, test, yes, no) {
 *   context.calculate(test, function(result) {
 *     context.calculate(result ? yes : no, resolve, reject);
 *   }, reject);
 * })
 *
 * Example for an asynchronous calculation function :
 * new CalculatorFunction("myAsyncFunc", "a, b", function(context, resolve, reject, a, b) {
 *   context.calculateAll([a, b], function(params) {
 *   	myAsyncFunc(params)
 *        .done(function(data) { resolve(data); })
 *        .fail(function(error) { reject(error); });
 *   }, reject);
 * })
 *
 * @param {String} token - the token, as seen in formula
 * @param {String} params - an optional description of parameters (not used directly in parser)
 * @param {Function} calculate - the function, used to evaluate the result, with signature calculate(context, resolve, reject, params... )
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
 * - - (subtract) is usually a binary left-associative operator (i.e. 3-2-1 === (3-2)-1) but is also an unary operator
 * - ** (exponentiation) is a binary right-associative operator (i.e. 2^2^3 === 2^(2^3))
 *
 * Example for the subtraction binary operator :
 * new CalculatorOperator("-", 11, 'left', function(context, resolve, reject, a, b) {
 *   context.calculateAll([a, b], function(params) {
 *     resolve(params[0] - params[1]);
 *   }, reject);
 * })
 *
 * Example for the ² postfix operator :
 * new CalculatorOperator("-", 14, 'postfix', function(context, resolve, reject, a) {
 *   context.calculate(a, function(result) {
 *     resolve(Math.pow(result, 2));
 *   }, reject);
 * })
 *
 * @param {String} token - the token, as seen in formula
 * @param {Number} precedence - the precedence of the operator (multiplication has greater precedence over addition)
 * @param {String} associativity - how to apply operator (can be "left" or "right" for binary operators and "prefix" or "postfix" for unary operators)
 * @param {Function} calculate - the function, used to evaluate the result, with signature calculate(context, resolve, reject, a[, b])
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
 * @param {String} formula - the formula where error occurred
 * @param {Number} index - the position in the formula where error occurred
 * @param {Number} length - the optional length of the token where error occurred
 * @param {String} message - the error message, that may contain parameters %0, %1, ...
 * @param {Array} params - the array of parameters, used to format
 */
function CalculatorError(formula, index, length, message, params) {
	this.formula = formula;
	this.index = index;
	this.length = length || 0;
	this.message = message;
	this.params = params;
}

/** Helper method to write formula to console and highlight the position where error occurred */
CalculatorError.prototype.console = function() {
	// Show formula on console
	console.log(this.formula);
	// Show error index in formula with ^
	if ('repeat' in String.prototype) {
		console.log(' '.repeat(this.index) + '^' + (this.length >= 2 ? ('-'.repeat(this.length - 2) + '^') : ''));
	} else {
		var s = '';
		while (s.length < this.index) s += ' ';
		console.log(s + '^');
	}
};

/** Helper method to highlight in an editable input or textarea the position where the error occurred */
CalculatorError.prototype.select = function(input) {
	input.focus();
	if ('createTextRange' in input) {
		// IE
		var range = input.createTextRange();
		range.collapse(true);
		range.moveEnd('character', this.index + this.length);
		range.moveStart('character', this.index);
		range.select();
	} else {
		// Nice browsers
		input.selectionEnd = this.index + this.length;
		input.selectionStart = this.index;
	}
};

/** Get the formatted error message, with the opportunity to translate with the optional "lang" parameter */
CalculatorError.prototype.format = function(lang) {
	// Call "lang" to allow message translation
	var s = lang ? lang(this.message) : this.message;
	// If the message is formatable
	if (this.params) {
		// Replace %0 with the first parameter, %1 with the second one, ...
		for (var i = 0; i < this.params.length; i++) {
			s = s.replace('%' + i, this.params[i]);
		}
	}
	// Return the formatted message
	return s;
};

/**
 * This class represents the AST of an expression :
 * - Calculator.parse transforms a string expression (a.k.a formula) into a CalculatorTree
 * - Calculator.format transforms the CalculatorTree into an expression (a.k.a formula)
 * - Calculator.calculate can compute the value of CalculatorTree
 *
 * @member {String} kind - either 'constant', 'literal', 'array', 'grouping', 'binary', 'prefix', 'postfix' or 'function'.
 * @member {String} token - the symbol of an 'operator'/ 'function' or the formula that resulted to this 'constant' / 'literal'
 * @member {CalculatorLiteral} literal - the literal definition that resulted to this 'literal'
 * @member {CalculatorType} type - the type of 'value' (if 'constant') of the expected evaluated value (for other kind of AST)
 * @member {*} value - the value of a 'constant'
 * @member {Array} params - the sub-elements of an 'array' or 'function'
 * @member {CalculatorTree} left - the first sub-element of a 'binary' operator or the single sub-element of a 'grouping' element or 'postfix' operator
 * @member {CalculatorTree} right - the second sub-element of a 'binary' operator or the single sub-element of a 'prefix' operator
 * @param model
 * @returns
 */
function CalculatorTree(model) {
	this.kind = model.kind;
	this.token = model.token;
	this.literal = model.literal;
	this.type = model.type;
	this.value = model.value;
	this.params = model.params;
	this.left = model.left;
	this.right = model.right;
}

/**
 * The calculator combines the grammar (~syntax) and the parser (parse/format/calculate)
 *
 * @member {Array} types - the supported types (integers, floats, integers in hexadecimal notation, string, dates, boolean, ...)
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
	this.types = [];
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
 * Helper method to support another type from from a name, a parse method and a format method.
 *
 * @see CalculatorType
 * @see Calculator.prototype.addTypeEntry
 */
Calculator.prototype.addType = function(name, parse, format) {
	this.addTypeEntry(new CalculatorType(name, parse, format));
};

/**
 * Helper method to support another type.
 *
 * @param {CalculatorType} entry - the type of values to add support for
 */
Calculator.prototype.addTypeEntry = function(entry) {
	this.types.push(entry);
};

/**
 * Helper method to add default type supports (null, boolean, date/times, numbers, ...)
 *
 * @param {Function(String)->String} lang - a function to allow translation
 */
Calculator.prototype.addDefaultTypes = function(lang) {
	var calculator = this;
	var nullToken = lang('null');
	var trueToken = lang('true');
	var falseToken = lang('false');

	// Add support for null values
	calculator.addType('null', function(t) {
		if (t === nullToken)
			return null;
	}, function(v) {
		return nullToken;
	});

	// Add support for boolean values
	calculator.addType('null', function(t) {
		if (t === trueToken)
			return true;
		if (t === falseToken)
			return false;
	}, function(v) {
		return !v ? falseToken : trueToken;
	});

	// Add support for dates, times or datetimes using moment
	function addMoment(name, utc, format) {
		var momentMethod = utc ? moment.utc : moment;
		var formatString = lang(format);
		calculator.addType(name, function(t) {
			var m = momentMethod(t, formatString, true/*strict*/);
			if (m.isValid())
				return m;
		}, function(m) {
			return m.format(formatString);
		});
	}
	addMoment('datetime', true, '"YYYY/MM/DD HH:mm"');
	addMoment('date', true, '"YYYY/MM/DD"');
	addMoment('time', true, '"HH:mm"');

	// Add support for strings AFTER date/time because they are a special kind of strings
	calculator.addType('string', function(token) {
		if (token.length >= 2 && token[0] === '"' && token[token.length - 1] === '"')
			return token.substring(1, token.length - 1).replace('\\"', '"');
	}, function(value) {
		return '"' + value.replace('"', '\\"') + '"';
	});

	// Add support for different number notations using rational expression
	function addRegExp(name, regexp, parse, format) {
		calculator.addType(name, function(token) {
			if (regexp.test(token))
				return parse(token);
		}, function(value) {
			return format(value);
		});
	}
	addRegExp('hexadecimal', /^0x[0-9a-fA-F]+$/,
			function(token) { return parseInt(token.substring(2), 16); },
			function(value) { return '0x' + value.toString(16); });
	addRegExp('octal', /^0o[0-7]+$/,
			function(token) { return parseInt(token.substring(2), 8); },
			function(value) { return '0o' + value.toString(8); });
	addRegExp('binary', /^0b[0-1]+$/,
			function(token) { return parseInt(token.substring(2), 2); },
			function(value) { return '0b' + value.toString(2); });
	addRegExp('float', /^\d+\.\d+$/,
			function(token) { return parseFloat(token); },
			function(value) { return value.toString(); });
	addRegExp('integer', /^\d+$/,
			function(token) { return parseInt(token); },
			function(value) { return value.toFixed(0); });
};

/**
 * Helper method to add a literal from a token and a value (either constant or variable).
 *
 * @see CalculatorLiteral
 * @see Calculator.prototype.addLiteralEntry
 */
Calculator.prototype.addLiteral = function(token, value, setter) {
	this.addLiteralEntry(new CalculatorLiteral(token, value, setter));
};

/**
 * Helper method to add a literal object (either constant or variable).
 *
 * @see CalculatorLiteral
 */
Calculator.prototype.addLiteralEntry = function(entry) {
	this.literals[entry.token.toLowerCase()] = entry;
};

/**
 * Helper method to add default literals "pi", "e" and "mem".
 *
 * @param {Function(String)->String} lang - a function to allow translation
 */
Calculator.prototype.addDefaultLiterals = function(lang) {
	var calculator = this;
	function add(token, value, setter) {
		calculator.addLiteral(lang(token), value, setter);
	}
	add('pi', Math.PI);
	add('e', Math.E);
	// The "mem" literal
	var mem = null;
	add('mem', function() { return mem; }, function(newValue) { mem = newValue; });
};

/**
 * Helper method to add a function from a token, a description of parameters and a function used for evaluation.
 *
 * @see CalculatorFunction
 * @see Calculator.prototype.addFunctionEntry
 */
Calculator.prototype.addFunction = function(token, params, calculate) {
	this.addFunctionEntry(new CalculatorFunction(token, params, calculate));
};

/**
 * Helper method to add a function object.
 *
 * @see CalculatorFunction
 */
Calculator.prototype.addFunctionEntry = function(entry) {
	this.functions[entry.token.toLowerCase()] = entry;
};

/**
 * Helper method to add default functions from javascript Math object, and an "if" function working like the "?:" operator.
 *
 * @param {Function(String)->String} lang - a function to allow translation
 */
Calculator.prototype.addDefaultFunctions = function(lang) {
	var calculator = this;
	function addFromMath(token, params) {
		calculator.addFunction(lang(token), params || '', function(context, resolve, reject) {
			// Evaluate all "arguments" after "context" and store values in "params"
			var params = [];
			for (var i = 3; i < arguments.length; i++) {
				params.push(arguments[i]);
			}
			context.calculateAll(params, function(values) {
				// Call Math function with evaluated values
				resolve(Math[token].apply(Math, values));
			}, reject);
		});
	}

	'random'.split(',').forEach(function(token) { addFromMath(token); });
	'abs,cos,sin,tan,acos,asin,atan,ceil,floor,round,exp,log,sqrt'.split(',').forEach(function(token) { addFromMath(token, 'x'); });
	'pow,atan2'.split(',').forEach(function(token) { addFromMath(token, 'x, y'); });
	'min,max'.split(',').forEach(function(token) { addFromMath(token, 'x1, x2*'); });

	calculator.addFunction(lang('cbrt'), lang('x'), function(context, resolve, reject, x) {
		context.calculate(x, function(x) {
			resolve((x < 0 ? -1 : 1) * Math.pow(Math.abs(x), 1/3));
		}, reject);
	});
	calculator.addFunction(lang('if'), lang('test, trueValue, falseValue'), function(context, resolve, reject, test, v1, v2) {
		context.calculate(test, function(result) {
			context.calculate(result ? v1 : v2, resolve, reject);
		}, reject);
	});
	if (typeof moment !== 'undefined') {
		calculator.addFunction(lang('formatDate'), lang('date, format'), function(context, resolve, reject, date, format) {
			context.calculateAll([date, format], function(results) {
				resolve(results[0].format(results[1]));
			}, reject);
		});
	}
};

/**
 * Helper method to add an operator from a token, a precedence, an associativity and a function used for evaluation.
 *
 * @see CalculatorOperator
 * @see Calculator.prototype.addOperatorEntry
 */
Calculator.prototype.addOperator = function(token, precedence, associativity, calculate) {
	this.addOperatorEntry(new CalculatorOperator(token, precedence, associativity, calculate));
};

/**
 * Helper method to add -in the appropriate map- an operator object.
 *
 * @see CalculatorOperator
 */
Calculator.prototype.addOperatorEntry = function(entry) {
	// Some tokens may be prefix, postfix and/or binary. For instance : "++" is prefix or postfix and "-" is prefix or binary
	// To avoid naming conflict, operators are stored internally in three different maps.
	// var operators = this[associativity + 'Operators'] || this.binaryOperators;
	var operators = ('prefix' === entry.associativity) ? this.prefixOperators : ('postfix' === entry.associativity) ? this.postfixOperators : this.binaryOperators;
	operators[entry.token.toLowerCase()] = entry;
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
	function add(token, associativity, calculate) {
		calculator.addOperator(lang(token), precedence, associativity, calculate);
	}
	function unary(calculate) {
		return function(context, resolve, reject, a) { context.calculate(a, function(result) { resolve(calculate(result)); }, reject); };
	}
	function variable(execute) {
		return function(context, resolve, reject, v) { resolve(execute(v.literal)); };
	}
	function binary(calculate) {
		return function(context, resolve, reject, a, b) { context.calculateAll([a, b], function(results) { resolve(calculate(results[0], results[1])); }, reject); };
	}
	var precedence = 0;
	// "," is also used to parse function parameters (between "(" and ")") or array elements (between "[" and "]")
	add(',', 'left', binary(function(a, b) { return a.concat ? a.concat(b) : [a, b]; }));
	precedence++;
	add('=', 'right', function(context, resolve, reject, variable, b) {
		context.calculate(b, function(result) {
			variable.literal.value = result;
			resolve(result);
		}, reject);
	}); // affectation
	// += -= **= *= /= %= <<= >>= >>>= &= ^= |=
	precedence++;
	// ? :
	precedence++;
	add('||', 'left', function(context, resolve, reject, a, b) {
		context.calculate(a, function(a) {
			if (a)
				resolve(true);
			else
				context.calculate(b, resolve, reject);
		}, reject);
	});
	precedence++;
	add('&&', 'left', function(context, resolve, reject, a, b) {
		context.calculate(a, function(a) {
			if (!a)
				resolve(false);
			else
				context.calculate(b, resolve, reject);
		}, reject);
	});
	precedence++;
	add('|', 'left', binary(function(a, b) { return a | b; })); // bitwise OR
	precedence++;
	add('^', 'left', binary(function(a, b) { return a ^ b; })); // bitwise XOR
	precedence++;
	add('&', 'left', binary(function(a, b) { return a & b; })); // bitwise AND
	precedence++;
	add('===', 'left', binary(function(a, b) { return a === b; }));
	add('!==', 'left', binary(function(a, b) { return a !== b; }));
	add('==', 'left', binary(/*jslint eqeq: true*/function(a, b) { return a == b; }));
	add('!=', 'left', binary(/*jslint eqeq: true*/function(a, b) { return a != b; })); // &#x2260;
	precedence++;
	add('<', 'left', binary(function(a, b) { return a < b; }));
	add('>', 'left', binary(function(a, b) { return a > b; }));
	add('<=', 'left', binary(function(a, b) { return a <= b; })); // &#x2264;
	add('>=', 'left', binary(function(a, b) { return a >= b; })); // &#x2265;
	add('∈', 'left', binary(function(a, b) { return b.indexOf(a) >= 0; }));
	// instanceof
	precedence++;
	add('<<', 'left', binary(function(a, b) { return a << b; }));
	add('>>', 'left', binary(function(a, b) { return a >> b; }));
	add('>>>', 'left', binary(function(a, b) { return a >>> b; }));
	precedence++;
	add('+', 'left', binary(function(a, b) { return a + b; })); // number addition and string concatenation
	add('-', 'left', binary(function(a, b) { return a - b; }));
	precedence++;
	add('**', 'right', binary(function(a, b) { return Math.pow(a, b); }));
	add('*', 'left', binary(function(a, b) { return a * b; })); // &#x00D7;
	add('/', 'left', binary(function(a, b) { return a / b; })); // &#x00F7;
	add('%', 'left', binary(function(a, b) { return a % b; }));
	precedence++;
	add('√', 'prefix', unary(function(a) { return Math.sqrt(a); }));
	add('!', 'prefix', unary(function(a) { return !a; })); // logical not
	add('~', 'prefix', unary(function(a) { return ~a; })); // bitwise not
	add('+', 'prefix', unary(function(a) { return +a; }));
	add('-', 'prefix', unary(function(a) { return -a; }));
	add('++', 'prefix', variable(function(v) { return ++v.value; }));
	add('--', 'prefix', variable(function(v) { return --v.value; }));
	precedence++;
	add('²', 'postfix', unary(function(a) { return Math.pow(a, 2); }));
	add('³', 'postfix', unary(function(a) { return Math.pow(a, 3); }));
	add('++', 'postfix', variable(function(v) { return v.value++; }));
	add('--', 'postfix', variable(function(v) { return v.value--; }));
	add('!', 'postfix', unary(function(a) { var result = 1; var v = Math.round(a); while (v !== 0) result *= v--; return result; })); // factorielle
	precedence++;
	// add('.', 'left', binary(function(a, b) { return a[b]; })); // member access
};

/**
 * This method tries to parse a formula into an abstract syntax tree (AST).
 * Then, you can use "format" or "calculate" methods, passing them the "parse" result AST.
 *
 * @param {String} formula - the formula to parse
 * @return {CalculatorTree} an object representing the expression
 */
Calculator.prototype.parse = function(formula) {
	var p;
	this.formula = formula.trim();
	this.index = 0;
	this.separators = ['(', ')', '[', ']', ' '];
	for (p in this.prefixOperators) {
		this.separators.push(p);
	}
	for (p in this.postfixOperators) {
		this.separators.push(p);
	}
	for (p in this.binaryOperators) {
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
	switch (tree.kind) {
		case 'constant': // 1, 123.45, true, null, ...
			return tree.type.format(tree.value);
		case 'literal': // pi, mem, ...
			return tree.token;
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
	}
	throw Error('Invalid tree node kind ' + tree.kind, tree);
};

/**
 * This method calculates the value of an AST (like the one extracted by "parse"). For instance :
 *
 * <code>
 * var formula = "1+  2 ²"
 * var ast = calculator.parse(formula);
 * calculator.calculate(ast, function(value) {
 *   console.log(value, typeof value); // 5, number
 * }, function(error) {
 *   console.log('Error', error);
 * });
 * </code>
 *
 * @param {Object} tree - the tree to evaluate
 */
Calculator.prototype.calculate = function(tree, resolve, reject) {
	if (typeof tree === 'undefined') {
		resolve(undefined);
		return;
	}
	switch (tree.kind) {
		case 'constant': // 1, 123.45, true, null, ...
			resolve(tree.value);
			break;
		case 'literal': // pi, mem, ...
			resolve(tree.literal.value);
			break;
		case 'array': // [ params ]
			this.calculateAll(tree.params, resolve, reject);
			break;
		case 'grouping': // ( ... )
			this.calculate(tree.left, resolve, reject);
			break;
		case 'binary': // left token right
			this.binaryOperators[tree.token].calculate(this, resolve, reject, tree.left, tree.right);
			break;
		case 'prefix': // token right
			this.prefixOperators[tree.token].calculate(this, resolve, reject, tree.right);
			break;
		case 'postfix': // left token
			this.postfixOperators[tree.token].calculate(this, resolve, reject, tree.left);
			break;
		case 'function': // token ( params )
			this.functions[tree.token].calculate.apply(null, [this, resolve, reject].concat(tree.params));
			break;
		default:
			reject(new Error('Invalid tree node kind ' + tree.kind, tree));
	}
};

Calculator.prototype.calculateAll = function(params, resolve, reject) {
	if (params.length === 0) {
		resolve([]);
		return;
	}
	var count = params.length;
	var values = [];
	values.length = count;
	params.forEach(function(param, index) {
		this.calculate(param, function(value) {
			values[index] = value;
			if (count === 1) // if this is the last one
				resolve(values); // we're done
			count--; // otherwise, decrement and continue "params" evaluation
		}, function(error) {
			count = 0; // setting "count" to 0 to ensure "resolve" is not called
			reject(error);
		});
	}.bind(this));
};

Calculator.prototype.reduce = function(tree, resolve, reject) {
	// Construit une literal temporaire sur la base d'un résultat.
	function makeLiteral(v) {
		var lit = new CalculatorLiteral('', v);
		lit.kind = 'literal';
		return lit;
	}

	// Retourne true si c'est valeur.
	function isConstant(o) {
		return typeof o === 'number'
			|| typeof o === 'boolean'
			|| typeof o === 'string'
			|| o === null
			|| o instanceof moment;
	}

	// Convertie une constante en une expression.
	var toExpression = function (o) {
		if (typeof o === 'object' && o && o.reduce)
			return o.reduce;
		if (typeof o === 'number')
			return '' + o;
		if (typeof o === 'boolean')
			return o === true ? 'true' : 'false';
		if (typeof o === 'string')
			return '"' + o + '"';
		if (o instanceof moment)
			return o.format(this.datetimeFormat);
		return 'null';
	}.bind(this);

	if (typeof tree === 'undefined') {
		resolve(undefined);
		return;
	}

	switch (tree.kind) {
		case 'constant': // 1, 123.45, true, null, ...
			resolve(tree.value);
			break;
		case 'literal': // pi, mem, ...
			if (! tree.literal.notResolved)
				resolve(tree.literal.value);
			else
				resolve({ reduce: tree.token });
			break;
		case 'array': // [ params ]
			this.reduceAll(tree.params, function(results) {
				if (results.every(isConstant))
					resolve(results);
				else
					resolve({ reduce: '[' + results.map(toExpression).join(',') + ']' });
			}.bind(this), reject);
			break;
		case 'grouping': // ( ... )
			this.reduce(tree.left, function(resultLeft) {
				if (isConstant(resultLeft))
					resolve(resultLeft);
				else
					resolve({ reduce: '(' + toExpression(resultLeft) + ')' });
			}.bind(this), reject);
			break;
		case 'binary': // left token right
			this.reduce(tree.left, function(resultLeft) {
				this.reduce(tree.right, function(resultRight) {
					if (isConstant(resultLeft) && isConstant(resultRight))
						this.binaryOperators[tree.token].calculate(this, resolve, reject, makeLiteral(resultLeft), makeLiteral(resultRight));
					else
						resolve({ reduce: toExpression(resultLeft) + tree.token + toExpression(resultRight) });
				}.bind(this), reject);
			}.bind(this), reject);
			break;
		case 'prefix': // token right
			this.reduce(tree.right, function(resultRight) {
				if (isConstant(resultRight))
					//JEROME -- ou ++ ne devrait pas reduce.
					this.prefixOperators[tree.token].calculate(this, resolve, reject, makeLiteral(resultRight));
				else
					//JEROME -- ou ++ ne devrait pas reduce.
					resolve({ reduce: tree.token + toExpression(resultRight) });
			}.bind(this), reject);
			break;
		case 'postfix': // left token
			this.reduce(tree.left, function(resultLeft) {
				if (isConstant(resultLeft))
					//JEROME -- ou ++ ne devrait pas reduce.
					this.postfixOperators[tree.token].calculate(this, resolve, reject, makeLiteral(resultLeft));
				else
					//JEROME -- ou ++ ne devrait pas reduce.
					resolve({ reduce: toExpression(resultLeft) + tree.token });
			}.bind(this), reject);
			break;
		case 'function': // token ( params )
			// JEROME les fonctions (comme "si") ne devraient pas toujours utiliser "reduceAll"
			this.reduceAll(tree.params, function(results) {
				if (results.every(isConstant))
					this.functions[tree.token].calculate.apply(null, [this, resolve, reject].concat(results.map(makeLiteral)));
				else
					resolve({ reduce: tree.token  + '(' + results.map(toExpression).join(',') + ')' });
			}.bind(this), reject);
			break;
		default:
			reject(new Error('Invalid tree node kind ' + tree.kind, tree));
	}
};

Calculator.prototype.reduceAll = function(params, resolve, reject) {
	if (params.length === 0) {
		resolve([]);
		return;
	}
	var count = params.length;
	var values = [];
	values.length = count;
	params.forEach(function(param, index) {
		this.reduce(param, function(value) {
			values[index] = value;
			if (count === 1) // if this is the last one
				resolve(values); // we're done
			count--; // otherwise, decrement and continue "params" evaluation
		}, function(error) {
			count = 0; // setting "count" to 0 to ensure "resolve" is not called
			reject(error);
		});
	}.bind(this));
};

/** stops the parsing process and reports an error. */
Calculator.prototype.error = function(message, params, tokenLength) {
	// Stop algorithm
	throw new CalculatorError(this.formula, this.index, tokenLength, message, params);
};

/** returns the next token of input or special marker "end" to represent that there are no more input tokens. "next" does not alter the input stream. */
Calculator.prototype.next = function() {
	// Parsing after string end throws an error
	if (this.index > this.formula.length)
		this.error('End of formula has been reached');
	// The last token when the string is over is an empty token
	if (this.index === this.formula.length)
		return '';
	var i;
	// Check if a string starts at current position
	if (this.formula[this.index] === '"') {
		// In that case, find the next closing quote
		var previous = '';
		i = this.index + 1;
		while (i < this.formula.length
				&& (this.formula[i] !== '"' || previous === '\\')) { // skip despecialized quotes
			previous = this.formula[i];
			i++;
		}
		if (i === this.formula.length)
			this.error('Un-terminated string started at position %0', [this.index], i - this.index);
		// Found a string
		return this.formula.substring(this.index, i + 1);
	}
	// Search the next occurence of each separators
	var index = -1, length = 0;
	for (i = 0; i < this.separators.length; i++) {
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
		this.error('Found "%1" but expecting "%2" at position %0', [this.index, s, text], s.length);
};

/**
 * This function reads the formula and, if successful, returns the corresponding AST as a CalculatorTree
 *
 * Different kind of tree :
 * - constant(type, value) : a static value (and also a leaf)
 * - literal(token, literal) : a token-backed value (also a leaf) but the value may be modifiable, asynchronous and/or impossible to reduce
 * - array(params) : an array of 0..N sub-elements, separated by "," and surrounded by "[" and "]"
 * - grouping(left) : a single sub-element, surrounded by "(" and ")" to deal with operator precedence
 * - binary(token, left, right) : a binary operator "token" with left and right sub-element as operands
 * - prefix(token, right) : an unary prefix operateur with a single "right" sub-element
 * - postfix(token, left) : an unary postfix operateur with a single "left" sub-element
 * - function(token, params) : a function using 0..B sub-elements, separated by "," and surrounded by "(" and ")"
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
		tree = new CalculatorTree({
			kind: 'binary',
			token: token,
			left: tree, // a primary in the first loop, a binary after that
			right: right
		});
		// And check if the next token is also a binary operator
		token = this.next().toLowerCase();
	}
	return tree;
};

Calculator.prototype.Primary = function() {
	// Get next token
	var token = this.next();
	var op, t;
	if (this.prefixOperators.hasOwnProperty(token.toLowerCase())) {
		// If token is a prefix operator : consume it, get right part expresion and we are done
		op = this.prefixOperators[token.toLowerCase()];
		this.consume(token);
		var q = op.precedence;
		var right = this.Exp(q);
		return new CalculatorTree({
			kind: 'prefix',
			token: token.toLowerCase(),
			right: right
		});
	}
	if ('(' === token) {
		// If token is a '(' : consume it, get a single grouped expression and we should find the closing ')'
		this.consume(token);
		t = this.Exp(0);
		this.expect(')');
		return new CalculatorTree({
			kind: 'grouping',
			left: t
		});
	}
	if ('[' === token) {
		// If token is a '[' : consume it, get a multiple expressions array and we should find the closing ']'
		this.consume(token);
		t = this.Array('array', ']');
		return t;
	}
	if (this.functions.hasOwnProperty(token.toLowerCase())) {
		// If the token is a function's name : consume it and get parameters between '(' and ')'
		var f = this.functions[token.toLowerCase()];
		this.consume(token);
		this.expect('(');
		t = this.Array('function', ')');
		t.token = token.toLowerCase();
		return t;
	}
	// Finally, the token should be a literal : consume it and check if it is followed by one or more postfix operators
	var left = this.Literal(token);
	this.consume(token);
	token = this.next().toLowerCase();
	while (this.postfixOperators.hasOwnProperty(token)) {
		op = this.postfixOperators[token];
		this.consume(token);
		left = new CalculatorTree({
			kind: 'postfix',
			token: token,
			left: left
		});
		token = this.next().toLowerCase();
	}
	return left;
};

Calculator.prototype.Array = function(kind, lastToken) {
	// Check for empty array or function without parameter
	var token = this.next();
	if (token === lastToken) {
		this.consume(token);
		return new CalculatorTree({ kind: kind, params: [] });
	}
	// array (true, 1, 2) will be represented in t as binary(binary(literal(true), literal(1)), literal(2))
	var t = this.Exp(0);
	this.expect(lastToken);
	// params will flatten the array into [literal(true), literal(1), literal(2)]
	var params = [];
	function add(tree) {
		if (tree.kind === 'binary' && tree.token === ',') {
			add(tree.left);
			params.push(tree.right);
		} else {
			params.push(tree);
		}
	}
	// start loop
	add(t);
	return new CalculatorTree({
		kind: kind,
		params: params
	});
};

Calculator.prototype.Literal = function(token) {
	var tokenLC = token.toLowerCase();

	// Throw error if the token is a function name
	if (this.functions.hasOwnProperty(tokenLC) || this.separators.indexOf(tokenLC) >= 0)
		this.error('Expecting a value but found "%1" at position %0', [this.index, token], token.length);

	// Predefined literals like pi, mem, ...
	if (this.literals.hasOwnProperty(tokenLC))
		return new CalculatorTree({ kind: 'literal', token: token, literal: this.literals[tokenLC] });

	// Type supported literals like boolean, dates, strings, numbers, ...
	for (var i = 0; i < this.types.length; i++) {
		var value = this.types[i].parse(token);
		if (value !== undefined)
			return new CalculatorTree({ kind: 'constant', value: value, type: this.types[i] });
	}

	// Unsupported literal
	this.error('Expecting a value but found "%1" at position %0', [this.index, token], token.length);
};
