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
 * - the "time" type support understands '"13:50:42"' (with quotes) as the time 1:50:42 PM
 * - the "datetime" type support understands '"2018/04/13 13:50:42"' (with quotes) as the date/time 13th April 2018 at 1:50:42 PM
 *
 * The list of type support is user-defined : some may use only integer, some may use different date format, ...
 *
 * @param {String} name - an internal name for the type support, to keep track of the input value (is the integer in decimal or octal format ?)
 * @param {Function} parse - a method receiving a token and returning either the corresponding value (if supported) or undefined (if unknown)
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
 * new CalculatorLiteral('pi', floatType, Math.PI);
 *
 * Example for "mem" variable :
 * var mem = 0;
 * new CalculatorLiteral('mem', integerType,
 *    function() { return mem; },
 *    function(newValue) { mem = newValue; }
 * );
 *
 * @param {String} token - the token, as seen in formula
 * @param {String} type - the type name of the value returned by this literal ('null', 'boolean', 'string', 'float', ...)
 * @param {*} value - the corresponding value (or the getter for a variable), used to evaluate the result
 * @param {Function} setter - the setter, if provided, for a variable called "token"
 */
function CalculatorLiteral(token, type, value, setter) {
	this.token = token;
	this.type = type;
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
 * A function is a token (its name), followed by arguments separated with a ',' and enclosed between parenthesis.
 * The behaviour of the function may be defined as :
 * - function calculate(context, resolve(treeConstant), reject(any), treeValues...) : all params are reduced and calculate is then called
 * - function reduce(context, resolve(treeReduced), reject(any), treeParams...) : more control on param's reduction is possible
 *
 * Example for "min" function providing the "calculate" method :
 * new CalculatorFunction("min", "a, b", undefined, function(context, resolve, reject, a, b) {
 *   resolve(CalculatorTree.newConstant(a.getType(), Math.min(a.getValue(), b.getValue()), undefined));
 * })
 *
 * Example for "if" function providing the "reduce" method :
 * new CalculatorFunction("if", "test, yes, no", function(context, resolve, reject, test, yes, no) {
 *   var self = this;
 *   context.reduce(test, function(result) {
 *     if (result.isValue())
 *       context.reduce(result.getValue() ? yes : no, resolve, reject);
 *     else
 *       context.reduceAll([yes, no], function(results) {
 *         resolve(CalculatorTree.newFunction(self, [result, results[0], results[1]], undefined));
 *       }, reject);
 *   }, reject);
 * }, undefined)
 *
 * Example for an asynchronous function providing the "calculate" method:
 * new CalculatorFunction("myAsyncFunc", "a, b", undefined, function(context, resolve, reject, a, b) {
 *   myAsyncBooleanFunc(a.getValue(), b.getValue())
 *     .done(function(data) { resolve(CalculatorTree.newConstant(booleanType, data, undefined)); })
 *     .fail(function(error) { reject(error); });
 * })
 *
 * @param {String} token - the token, as seen in formula
 * @param {String} params - an optional description of parameters (not used directly in parser)
 * @param {Function} reduce - the function, used to reduce to a single value, if possible, or to a reduced function expression otherwise
 * @param {Function} calculate - the function, used to evaluate the result, with signature calculate(context, resolve, reject, params... )
 */
function CalculatorFunction(token, params, reduce, calculate) {
	this.token = token;
	this.params = params;
	this.reduce = reduce || CalculatorFunction.defaultReduce(calculate);
}

CalculatorFunction.defaultReduce = function(calculate) {
	return function(context, resolve, reject) {
		var self = this;
		var params = Array.prototype.slice.apply(arguments, [3]);
		context.reduceAll(params, function(results) {
			if (results.filter(function(r) { return !r.isValue(); }).length === 0)
				calculate.apply(null, [context, resolve, reject].concat(results));
			else
				resolve(CalculatorTree.newBinary(self, results[0], results[1], undefined));
		});
	};
};

/**
 * An operator is a token used to transforme a value (unary) or to combine two values (binary) :
 * - ! (logical not) is a prefix unary operator (i.e. !true === false)
 * - ² (square) is a postfix unary operator (i.e. 2² === 4)
 * - - (subtract) is usually a binary left-associative operator (i.e. 3-2-1 === (3-2)-1) but is also an unary operator
 * - ** (exponentiation) is a binary right-associative operator (i.e. 2^2^3 === 2^(2^3))
 *
 * Example for the "subtraction" binary operator providing the "calculate" method :
 * new CalculatorOperator("-", 11, 'left', undefined, function(context, resolve, reject, a, b) {
 *   resolve(CalculatorTree.newConstant(a.getType(), a.getValue() - b.getValue(), undefined));
 * })
 *
 * Example for the "²" postfix operator providing the "calculate" method :
 * new CalculatorOperator("²", 14, 'postfix', undefined, function(context, resolve, reject, a) {
 *   resolve(CalculatorTree.newConstant(a.getType(), Math.pow(a.getValue(), 2), undefined));
 * })
 *
 * Example for the "&&" logical operator providing the "reduce" method :
 * new CalculatorOperator("&&", 4, 'left', function(context, resolve, reject, a, b) {
 *   var self = this;
 *   context.reduce(a, function(a) {
 *     if (a.isValue()) {
 *       if (a.getValue())
 *         context.reduce(b, resolve, reject);
 *       else
 *         resolve(a);
 *     } else {
 *       context.reduce(b, function(b) {
 *         resolve(CalculatorTree.newBinary(self, a, b, undefined));
 *       }, reject);
 *     }
 *   }, reject);
 * }, undefined)
 *
 * @param {String} token - the token, as seen in formula
 * @param {Number} precedence - the precedence of the operator (multiplication has greater precedence over addition)
 * @param {String} associativity - how to apply operator (can be "left" or "right" for binary operators and "prefix" or "postfix" for unary operators)
 * @param {Function} calculate - the function, used to evaluate the result, with signature calculate(context, resolve, reject, a[, b])
 */
function CalculatorOperator(token, precedence, associativity, reduce, calculate) {
	this.token = token;
	this.precedence = precedence;
	this.associativity = associativity;
	if (reduce)
		this.reduce = reduce;
	else if (associativity === 'prefix')
		this.reduce = CalculatorOperator.defaultPrefixReduce(calculate);
	else if (associativity === 'postfix')
		this.reduce = CalculatorOperator.defaultPostfixReduce(calculate);
	else
		this.reduce = CalculatorOperator.defaultBinaryReduce(calculate);
}

CalculatorOperator.defaultBinaryReduce = function(calculate) {
	return function(context, resolve, reject, left, right) {
		var self = this;
		context.reduceAll([left, right], function(results) {
			if (results[0].isValue() && results[1].isValue())
				calculate(context, resolve, reject, results[0], results[1]);
			else
				resolve(CalculatorTree.newBinary(self, results[0], results[1], undefined));
		});
		
	};
};

CalculatorOperator.defaultPrefixReduce = function(calculate) {
	return function(context, resolve, reject, right) {
		var self = this;
		context.reduce(right, function(result) {
			if (result.isValue())
				calculate(context, resolve, reject, result);
			else
				resolve(CalculatorTree.newPrefix(self, result, undefined));
		});
	};
};

CalculatorOperator.defaultPostfixReduce = function(calculate) {
	return function(context, resolve, reject, left) {
		var self = this;
		context.reduce(left, function(result) {
			if (result.isValue())
				calculate(context, resolve, reject, result);
			else
				resolve(CalculatorTree.newPostfix(self, result, undefined));
		});
	};
};

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
	var s = ' '; // 1 space
	while (s.length < this.index) s = s + s; // x2 x4 ...
	s = s.substring(0, this.index); // truncate
	console.log(this.formula + '\n' + s + '^');
};

/** Helper method to highlight in an editable input or textarea the position where the error occurred */
CalculatorError.prototype.select = function(input) {
	input.focus();
	input.selectionEnd = this.index + this.length;
	input.selectionStart = this.index;
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
 * - Calculator.reduce can simplify a CalculatorTree, possibly to a single constant
 *
 * @member {String} kind - either 'constant', 'literal', 'array', 'grouping', 'binary', 'prefix', 'postfix' or 'function'
 * @member {String} token - the symbol of an 'operator'/ 'function' or the formula that resulted to this 'constant' / 'literal'
 * @member {Calculator*} source - the literal, operator or function definition that resulted to this 'literal', 'binary', 'prefix', 'postfix' or 'function'
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
	this.source = model.source;
	this.type = model.type;
	this.value = model.value;
	this.params = model.params;
	this.left = model.left;
	this.right = model.right;
}

CalculatorTree.prototype.isValue = function() { return this.kind === 'constant' || this.kind === 'literal' /*TODO and this.source.resolvable*/; };
CalculatorTree.prototype.getValue = function() { return this.kind === 'constant' ? this.value : this.source.value; };
CalculatorTree.prototype.getType = function() { return this.kind === 'constant' ? this.type : this.source.type; };

CalculatorTree.newConstant = function(type, value, token) { return new CalculatorTree({ kind: 'constant', type: type, value: value, token: token }); };
CalculatorTree.newLiteral = function(literal, token) { return new CalculatorTree({ kind: 'literal', source: literal, token: token }); };
CalculatorTree.newArray = function(params) { return new CalculatorTree({ kind: 'array', params: params }); };
CalculatorTree.newGrouping = function(left) { return new CalculatorTree({ kind: 'grouping', left: left }); };
CalculatorTree.newBinary = function(operator, left, right, token) { return new CalculatorTree({ kind: 'binary', source: operator, left: left, right: right, token: token }); };
CalculatorTree.newPrefix = function(operator, right, token) { return new CalculatorTree({ kind: 'prefix', source: operator, right: right, token: token }); };
CalculatorTree.newPostfix = function(operator, left, token) { return new CalculatorTree({ kind: 'postfix', source: operator, left: left, token: token }); };
CalculatorTree.newFunction = function(func, params, token) { return new CalculatorTree({ kind: 'function', source: func, params: params, token: token }); };

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
 * @param {moment} moment - the moment API (or moment.uct API), if available. If not, the 'date', 'time' and 'datetime' types won't be available
 */
Calculator.prototype.addDefaultTypes = function(lang, moment) {
	var calculator = this;
	var nullToken = lang('null').toLowerCase();
	var trueToken = lang('true').toLowerCase();
	var falseToken = lang('false').toLowerCase();

	// Add support for null values
	calculator.addType('null', function(t) {
		if (t.toLowerCase() === nullToken)
			return null;
	}, function(v) {
		return nullToken;
	});

	// Add support for boolean values
	calculator.addType('boolean', function(t) {
		if (t.toLowerCase() === trueToken)
			return true;
		if (t.toLowerCase() === falseToken)
			return false;
	}, function(v) {
		return !v ? falseToken : trueToken;
	});

	// Add support for dates, times or datetimes using moment
	function addMoment(name, format, hasDate, hasTime) {
		var formatString = lang(format);
		calculator.addType(name, function(t) {
			var m = moment(t, formatString, true/*strict*/);
			if (m.isValid()) {
				var r = {};
				if (hasDate) {
					r.year = m.year();
					r.month = m.month();
					r.date = m.date();
				}
				if (hasTime) {
					r.hour = m.hour();
					r.minute = m.minute();
					r.second = m.second();
				}
				return r;
			}
		}, function(v) {
			return moment(v).format(formatString);
		});
	}
	if (typeof moment !== 'undefined') {
		addMoment('datetime', '"YYYY/MM/DD HH:mm:ss"', true, true);
		addMoment('date', '"YYYY/MM/DD"', true, false);
		addMoment('time', '"HH:mm:ss"', false, true);
	}

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
			function(value) { return (value < 0 ? '-0x' : '0x') + Math.abs(value).toString(16); });
	addRegExp('octal', /^0o[0-7]+$/,
			function(token) { return parseInt(token.substring(2), 8); },
			function(value) { return (value < 0 ? '-0o' : '0o') + Math.abs(value).toString(8); });
	addRegExp('binary', /^0b[0-1]+$/,
			function(token) { return parseInt(token.substring(2), 2); },
			function(value) { return (value < 0 ? '-0b' : '0b') + Math.abs(value).toString(2); });
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
Calculator.prototype.addLiteral = function(token, type, value, setter) {
	this.addLiteralEntry(new CalculatorLiteral(token, type, value, setter));
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
	var floatType = calculator.types.filter(function(t) { return t.name === 'float'; })[0];
	var nullType = calculator.types.filter(function(t) { return t.name === 'null'; })[0];
	calculator.addLiteral(lang('pi'), floatType, Math.PI);
	calculator.addLiteral(lang('e'), floatType, Math.E);
	calculator.addLiteral(lang('mem'), nullType, null);
};

/**
 * Helper method to add a function from a token, a description of parameters and a function used for evaluation.
 *
 * @see CalculatorFunction
 * @see Calculator.prototype.addFunctionEntry
 */
Calculator.prototype.addFunction = function(token, params, reduce, calculate) {
	this.addFunctionEntry(new CalculatorFunction(token, params, reduce, calculate));
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
 * @param {moment} moment - the moment API (or moment.utc API), if available. If not, the 'formatDate' function won't be available
 */
Calculator.prototype.addDefaultFunctions = function(lang, moment) {
	var calculator = this;
	var floatType = calculator.types.filter(function(t) { return t.name === 'float'; })[0];
	var stringType = calculator.types.filter(function(t) { return t.name === 'string'; })[0];
	var integerType = calculator.types.filter(function(t) { return t.name === 'integer'; })[0];
	var firstType = function(types) { return types[0]; };
	var numericType = function(types) { return types.indexOf(floatType) >= 0 ? floatType : integerType; }; 

	function addFromMath(token, params, type) {
		calculator.addFunction(lang(token), params || '', undefined, function(context, resolve, reject) {
			// Get all parameters for the Math function
			var params = Array.prototype.slice.apply(arguments, [3]);
			// Calculate the value
			var constantValue = Math[token].apply(Math, params.map(function(p) { return p.getValue(); }));
			// Get the type if the result
			var constantType = (typeof type === 'function') ? type(params.map(function(p) { return p.getType(); })) : type;
			// Call Math function with evaluated values
			resolve(CalculatorTree.newConstant(constantType, constantValue, undefined));
		});
	}

	'random'.split(',').forEach(function(token) { addFromMath(token, '', floatType); });
	'abs'.split(',').forEach(function(token) { addFromMath(token, 'x', firstType); });
	'cos,sin,tan,acos,asin,atan,exp,log,sqrt'.split(',').forEach(function(token) { addFromMath(token, 'x', floatType); });
	'ceil,floor,round'.split(',').forEach(function(token) { addFromMath(token, 'x', integerType); });
	'pow,atan2'.split(',').forEach(function(token) { addFromMath(token, 'x, y', floatType); });
	'min,max'.split(',').forEach(function(token) { addFromMath(token, 'x1, x2*', numericType); });

	calculator.addFunction(lang('cbrt'), lang('x'), undefined, function(context, resolve, reject, x) {
		var value = x.getValue();
		resolve(CalculatorTree.newConstant(floatType, (value < 0 ? -1 : 1) * Math.pow(Math.abs(value), 1/3), undefined));
	});
	calculator.addFunction(lang('if'), lang('test, trueValue, falseValue'), function(context, resolve, reject, test, v1, v2) {
		var self = this;
		context.reduce(test, function(result) {
			if (result.isValue()) {
				context.reduce(result.getValue() ? v1 : v2, resolve, reject);
			} else {
				context.reduceAll([v1, v2], function(results) {
					resolve(CalculatorTree.newFunction(self, [result, results[0], results[1]], undefined));
				}, reject);
			}
		}, reject);
	}, undefined);

	function addDatePart(token, extract) {
		calculator.addFunction(lang(token), lang('date'), undefined, function(context, resolve, reject, date) {
			var v = date.getValue();
			if (v === null)
				resolve(CalculatorTree.newConstant(nullType, null, undefined));
			else
				resolve(CalculatorTree.newConstant(integerType, extract(v), undefined));
		});
	}
	if (typeof moment !== 'undefined') {
		calculator.addFunction(lang('formatDate'), lang('date, format'), undefined, function(context, resolve, reject, date, format) {
			resolve(CalculatorTree.newConstant(stringType, moment(date.getValue()).format(format.getValue()), undefined));
		});
		addDatePart('year', function(date) { return date.year; });
		addDatePart('month', function(date) { return date.month + 1; });
		addDatePart('date', function(date) { return date.date; });
		addDatePart('hour', function(date) { return date.hour; });
		addDatePart('minute', function(date) { return date.minute; });
		addDatePart('second', function(date) { return date.second; });
	}
};

/**
 * Helper method to add an operator from a token, a precedence, an associativity and a function used for evaluation.
 *
 * @see CalculatorOperator
 * @see Calculator.prototype.addOperatorEntry
 */
Calculator.prototype.addOperator = function(token, precedence, associativity, reduce, calculate) {
	this.addOperatorEntry(new CalculatorOperator(token, precedence, associativity, reduce, calculate));
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
	var floatType = calculator.types.filter(function(t) { return t.name === 'float'; })[0];
	var binaryType = calculator.types.filter(function(t) { return t.name === 'binary'; })[0];
	var stringType = calculator.types.filter(function(t) { return t.name === 'string'; })[0];
	var booleanType = calculator.types.filter(function(t) { return t.name === 'boolean'; })[0];
	var integerType = calculator.types.filter(function(t) { return t.name === 'integer'; })[0];

	function add(token, associativity, reduce, calculate) {
		calculator.addOperator(lang(token), precedence, associativity, reduce, calculate);
	}
	function unary(type, calculate) {
		return function(context, resolve, reject, a) { resolve(CalculatorTree.newConstant(type || a.getType(), calculate(a.getValue()), undefined)); };
	}
	function variable(execute) {
		return function(context, resolve, reject, v) { resolve(CalculatorTree.newConstant(v.source.type, execute(v.source), undefined)); };
	}
	function binary(type, calculate) {
		return function(context, resolve, reject, a, b) { resolve(CalculatorTree.newConstant(type, calculate(a.getValue(), b.getValue()), undefined)); };
	}
	var precedence = 0;
	// "," is also used to parse function parameters (between "(" and ")") or array elements (between "[" and "]")
	add(',', 'left', function(context, resolve, reject, a, b) {
		context.reduceAll([a, b], function(values) {
			resolve(CalculatorTree.newArray(values));
		});
	}, undefined);
	precedence++;
	add('=', 'right', function(context, resolve, reject, variable, b) {
		context.reduce(b, function(b) {
			if (b.isValue()) {
				variable.source.value = b.getValue();
				variable.source.type = b.getType();
			}
			resolve(b);
		}, reject);
	}, undefined); // affectation
	// += -= **= *= /= %= <<= >>= >>>= &= ^= |=
	precedence++;
	// ? :
	precedence++;
	add('||', 'left', function(context, resolve, reject, a, b) {
		var self = this;
		context.reduce(a, function(a) {
			if (a.isValue() && a.getValue())
				resolve(a);
			else
				context.reduce(b, function(b) {
					if (b.isValue() && b.getValue())
						resolve(b);
					else
						resolve(a.isValue() ? b : b.isValue() ? a : CalculatorTree.newBinary(self, a, b, undefined));
				}, reject);
		}, reject);
	}, undefined);
	precedence++;
	add('&&', 'left', function(context, resolve, reject, a, b) {
		var self = this;
		context.reduce(a, function(a) {
			if (a.isValue() && !a.getValue())
				resolve(a);
			else
				context.reduce(b, function(b) {
					if (b.isValue() && !b.getValue())
						resolve(b);
					else
						resolve(a.isValue() ? b : b.isValue() ? a : CalculatorTree.newBinary(self, a, b, undefined));
				}, reject);
		}, reject);
	}, undefined);
	precedence++;
	add('|', 'left', undefined, binary(binaryType, function(a, b) { return a | b; })); // bitwise OR
	precedence++;
	add('^', 'left', undefined, binary(binaryType, function(a, b) { return a ^ b; })); // bitwise XOR
	precedence++;
	add('&', 'left', undefined, binary(binaryType, function(a, b) { return a & b; })); // bitwise AND
	precedence++;
	add('===', 'left', undefined, binary(booleanType, function(a, b) { return a === b; }));
	add('!==', 'left', undefined, binary(booleanType, function(a, b) { return a !== b; }));
	add('==', 'left', undefined, binary(booleanType, /*jslint eqeq: true*/function(a, b) { return a == b; }));
	add('!=', 'left', undefined, binary(booleanType, /*jslint eqeq: true*/function(a, b) { return a != b; }));
	precedence++;
	add('<', 'left', undefined, binary(booleanType, function(a, b) { return a < b; }));
	add('>', 'left', undefined, binary(booleanType, function(a, b) { return a > b; }));
	add('<=', 'left', undefined, binary(booleanType, function(a, b) { return a <= b; }));
	add('>=', 'left', undefined, binary(booleanType, function(a, b) { return a >= b; }));
	add('∈', 'left', function(context, resolve, reject, a, b) {
		var self = this;
		context.reduceAll([a, b], function(results) {
			var value, hasVariable, i, p;
			if (results[0].isValue()) {
				value = results[0].getValue();
				for (i = 0; i < results[1].params.length; i++) {
					p = results[1].params[i];
					if (! p.isValue())
						hasVariable = true;
					else if (p.getValue() === value) {
						resolve(CalculatorTree.newConstant(booleanType, true));
						return;
					}
				}
				if (!hasVariable) {
					resolve(CalculatorTree.newConstant(booleanType, false));
					return;
				}
			}
			resolve(CalculatorTree.newBinary(self, results[0], results[1], undefined));
		});
	}, undefined);
	// instanceof
	precedence++;
	add('<<', 'left', undefined, binary(integerType, function(a, b) { return a << b; }));
	add('>>', 'left', undefined, binary(integerType, function(a, b) { return a >> b; }));
	add('>>>', 'left', undefined, binary(integerType, function(a, b) { return a >>> b; }));
	precedence++;
	add('+', 'left', undefined, function(context, resolve, reject, a, b) {
		var value = a.getValue() + b.getValue(); // number addition and string concatenation
		resolve(CalculatorTree.newConstant(typeof value === 'string' ? stringType : floatType, value, undefined));
	}); 
	add('-', 'left', undefined, binary(floatType, function(a, b) { return a - b; }));
	precedence++;
	add('**', 'right', undefined, binary(floatType, function(a, b) { return Math.pow(a, b); }));
	add('*', 'left', undefined, binary(floatType, function(a, b) { return a * b; })); // &#x00D7;
	add('/', 'left', undefined, binary(floatType, function(a, b) { return a / b; })); // &#x00F7;
	add('%', 'left', undefined, binary(floatType, function(a, b) { return a % b; }));
	precedence++;
	add('√', 'prefix', undefined, unary(floatType, function(a) { return Math.sqrt(a); }));
	add('!', 'prefix', undefined, unary(booleanType, function(a) { return !a; })); // logical not
	add('~', 'prefix', undefined, unary(undefined, function(a) { return ~a; })); // bitwise not
	add('+', 'prefix', undefined, unary(undefined, function(a) { return +a; }));
	add('-', 'prefix', undefined, unary(undefined, function(a) { return -a; }));
	add('++', 'prefix', variable(function(v) { return ++v.value; }));
	add('--', 'prefix', variable(function(v) { return --v.value; }));
	precedence++;
	add('²', 'postfix', undefined, unary(undefined, function(a) { return Math.pow(a, 2); }));
	add('³', 'postfix', undefined, unary(undefined, function(a) { return Math.pow(a, 3); }));
	add('++', 'postfix', variable(function(v) { return v.value++; }));
	add('--', 'postfix', variable(function(v) { return v.value--; }));
	add('!', 'postfix', undefined, unary(integerType, function(a) { var result = 1; var v = Math.round(a); while (v !== 0) result *= v--; return result; })); // factorielle
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
 * calculator.reduce(ast, function(output) {
 *   console.log(calculator.format(output)); // "5"
 * });
 * </code>
 *
 * @param {Object} tree - the tree to format into a string
 */
Calculator.prototype.format = function(tree) {
	switch (tree.kind) {
		case 'constant': // 1, 123.45, true, null, ...
			return tree.type.format(tree.value);
		case 'literal': // pi, mem, ...
			return tree.token || tree.source.token;
		case 'array': // [ params ]
			return '[' + tree.params.map(this.format.bind(this)).join(', ') + ']';
		case 'grouping': // ( left )
			return '(' + this.format(tree.left) + ')';
		case 'binary': // left token right
			return this.format(tree.left) + ' ' + (tree.token || tree.source.token) + ' ' + this.format(tree.right);
		case 'prefix': // token right
			return (tree.token || tree.source.token) + this.format(tree.right);
		case 'postfix': // left token
			return this.format(tree.left) + (tree.token || tree.source.token);
		case 'function': // token ( params )
			return (tree.token || tree.source.token) + '(' + tree.params.map(this.format.bind(this)).join(', ') + ')';
	}
	throw Error('Invalid tree node kind ' + tree.kind, tree);
};

Calculator.prototype.reduce = function(tree, resolve, reject) {
	if (typeof tree === 'undefined') {
		resolve(undefined);
		return;
	}

	switch (tree.kind) {
		case 'constant': // 1, 123.45, true, null, ...
			resolve(tree);
			break;
		case 'literal': // pi, mem, ...
			if (tree.source.notResolved)
				resolve(tree);
			else
				resolve(CalculatorTree.newConstant(tree.source.type, tree.source.value, undefined));
			break;
		case 'array': // [ params ]
			this.reduceAll(tree.params, function(results) {
				resolve(CalculatorTree.newArray(results));
			}, reject);
			break;
		case 'grouping': // ( ... )
			this.reduce(tree.left, function(resultLeft) {
				if (resultLeft.kind === 'constant')
					resolve(resultLeft);
				else
					resolve(CalculatorTree.newGrouping(resultLeft));
			}, reject);
			break;
		case 'binary': // left token right
			tree.source.reduce(this, resolve, reject, tree.left, tree.right);
			break;
		case 'prefix': // token right
			tree.source.reduce(this, resolve, reject, tree.right);
			break;
		case 'postfix': // left token
			tree.source.reduce(this, resolve, reject, tree.left);
			break;
		case 'function': // token ( params )
			tree.source.reduce.apply(tree.source, [this, resolve, reject].concat(tree.params));
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
		tree = CalculatorTree.newBinary(op, tree /*a primary in the first loop, a binary after that*/, right, token);
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
		return CalculatorTree.newPrefix(op, right, token.toLowerCase());
	}
	if ('(' === token) {
		// If token is a '(' : consume it, get a single grouped expression and we should find the closing ')'
		this.consume(token);
		t = this.Exp(0);
		this.expect(')');
		return CalculatorTree.newGrouping(t);
	}
	if ('[' === token) {
		// If token is a '[' : consume it, get a multiple expressions array and we should find the closing ']'
		this.consume(token);
		return CalculatorTree.newArray(this.Array(']'));
	}
	if (this.functions.hasOwnProperty(token.toLowerCase())) {
		// If the token is a function's name : consume it and get parameters between '(' and ')'
		var f = this.functions[token.toLowerCase()];
		this.consume(token);
		this.expect('(');
		return CalculatorTree.newFunction(f, this.Array(')'), token);
	}
	// Finally, the token should be a literal : consume it and check if it is followed by one or more postfix operators
	var left = this.Literal(token);
	this.consume(token);
	token = this.next().toLowerCase();
	while (this.postfixOperators.hasOwnProperty(token)) {
		op = this.postfixOperators[token];
		this.consume(token);
		left = CalculatorTree.newPostfix(op, left, token);
		token = this.next().toLowerCase();
	}
	return left;
};

Calculator.prototype.Array = function(lastToken) {
	// Check for empty array or function without parameter
	var token = this.next();
	if (token === lastToken) {
		this.consume(token);
		return [];
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
	return params;
};

Calculator.prototype.Literal = function(token) {
	var tokenLC = token.toLowerCase();

	// Throw error if the token is a function name
	if (this.functions.hasOwnProperty(tokenLC) || this.separators.indexOf(tokenLC) >= 0)
		this.error('Expecting a value but found "%1" at position %0', [this.index, token], token.length);

	// Predefined literals like pi, mem, ...
	if (this.literals.hasOwnProperty(tokenLC))
		return CalculatorTree.newLiteral(this.literals[tokenLC], token);

	// Type supported literals like boolean, dates, strings, numbers, ...
	for (var i = 0; i < this.types.length; i++) {
		var value = this.types[i].parse(token);
		if (value !== undefined)
			return CalculatorTree.newConstant(this.types[i], value, token);
	}

	// Unsupported literal
	this.error('Expecting a value but found "%1" at position %0', [this.index, token], token.length);
};
