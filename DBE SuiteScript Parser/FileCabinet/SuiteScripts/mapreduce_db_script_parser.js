/**
 * @NApiVersion 2.x
 * @NScriptType MapReduceScript
 */

/**
 * Copyright (c) 1998-2015 NetSuite, Inc.
 * 2955 Campus Drive, Suite 100, San Mateo, CA, USA 94403-2511
 * All Rights Reserved.
 *
 * This software is the confidential and proprietary information of NetSuite, Inc. ("Confidential Information").
 * You shall not disclose such Confidential Information and shall use it only in accordance with the terms of the license agreement
 * you entered into with NetSuite.
 */

/**
 * Module Description
 * SuiteScript 2.0 Converter Map/Reduce Script
 *
 * Version      Date            Author              Remarks
 * 0.1          June 2018       Daren Garcia        Initial draft
 *
 **/

define([
	'./Library/esprima',
	'./Library/library_db_parser_mappings',
	'N/file',
	'N/log',
	'N/record',
	'N/runtime',
	'N/search'
	/* './NS_SSConverter_API', */
	/* './NS_SSConverter_Const', */
],
	function (
		esprima,
		mappings,
		file,
		log,
		record,
		runtime,
		search
		/* API,
        CONST, */
	) {
		var PREFIX = 'MR.SSConverter.';
		const NAMES = {
			RETURN_STATEMENT: "ReturnStatement",
			FUNCTION_DECLARATION: "FunctionDeclaration",
			VARIABLE_DECLARATION: "VariableDeclaration", //returns
			EXPRESSION_STATEMENT: "ExpressionStatement", //SAMPLE: script.scriptFunctions[2].body.body[1].expression
			CALL_EXPRESSION: "CallExpression", //SAMPLE: script.scriptFunctions[2].body.body[2].expression.right.arguments
			MEMBER_EXPRESSION: "MemberExpression",
			//SAMPLE: script.scriptFunctions[2].body.body[2].expression.right.callee.object
			//SAMPLE: script.scriptFunctions[2].body.body[2].expression.right.callee.property
			BLOCK_STATEMENT: "BlockStatement",
			TRY_STATEMENT: "TryStatement",
			FOR_STATEMENT: "ForStatement",
			OBJECT_EXPRESSION: "ObjectExpression",
			IF_STATEMENT: "IfStatement",
			ASSIGNMENT_EXPRESSION: "AssignmentExpression",
			SWITCH_STATEMENT: "SwitchStatement",
			SWITCH_CASE: "SwitchCase",
			//do/while loops for in
			DO_WHILE: "DoWhileStatement",
			WHILE_STATEMENT: "WhileStatement",
			LITERAL: "Literal",
			IDENTIFIER: "Identifier",
			VARIABLE_DECLARATOR: "VariableDeclarator",
			FUNCTION_EXPRESSION: "FunctionExpression"
		}
		var entryFunctions = new Array();
		var allFunctions = new Array();
		var returnStatement = new Array();
		var modules = [
			'search',
			'record',
		];

		function _getFileIdFromName(obj) {
			//log.debug('file name: ' + obj.name);
			if (!obj) {
				//log.debug('getFileIdFromName - No obj provided');
			}
			var sdSearch = search.create({
				type: 'file'
			});
			sdSearch.filters = [
				search.createFilter({
					name: 'name',
					operator: search.Operator.IS,
					values: obj.name
				})
			];
			var resultSet = sdSearch.run();
			var results = resultSet.getRange({
				start: 0,
				end: 1
			});
			if (results[0])
				return results[0].id;
			else
				return null;
		}

		function _getInput() {
			var LOG_TITLE,
				scriptCurr,
				scriptIds,
				scriptType,
				fileIds,
				splitScriptIds,
				splitFileIds,
				result,
				parseType,
				parseRecords;

			var script = runtime.getCurrentScript();
			var param = script.getParameter({
				name: 'custscript_scripts_to_parse'
			});
			//log.debug('item list: ' + param);
			LOG_TITLE = PREFIX + 'getInputData';
			// array of script meta data objects on line 187
			result = new Array();
			scriptCurr = runtime.getCurrentScript();

			//are you parsing by record or internal id
			parseType = scriptCurr.getParameter({
				name: 'custscript_parse_by'
			});
			//parseType = parseInt(parseType);
			parseRecords = scriptCurr.getParameter({
				name: 'custscript_scripts_to_parse'
			});
			fileIds = scriptCurr.getParameter({
				name: 'custscript_files_to_parse'
			});
			//create master record
			//customrecord_main_parse_summary
			var custRec = record.create({
				type: 'customrecord_main_parse_summary',
				isDynamic: true
			});

			//var masterId = custRec.save();
			// execute the saved search to find all the internal ids of user events and client scripts on the record of choice

			switch (parseType) {
				case 'record':
					if (parseRecords) {
						var sdSearch = search.load({
							id: 'customsearch_parse_script_deployment'
						});
						sdSearch.filters = [
							search.createFilter({
								name: 'recordtype',
								operator: search.Operator.IS,
								values: parseRecords
							}),
							search.createFilter({
								name: 'isdeployed',
								operator: search.Operator.IS,
								values: 'T'
							}),
							search.createFilter({
								name: 'scripttype',
								join: 'script',
								operator: search.Operator.ANYOF,
								values: ['USEREVENT', 'CLIENT']
							})
						];
						sdSearch.columns = [
							search.createColumn({
								name: 'internalid',
								join: 'script'
							})
						]
						var resultSet = sdSearch.run();
						var results = resultSet.getRange({
							start: 0,
							end: 1000
						});
						////log.debug('results', results);

						//Get the record type and format it and set it on the master parse custom record
						if (results[0]) {
							var recType = parseRecords;
							if (recType)
								recType = mappings.getRecordText(recType);

							custRec.setValue({
								fieldId: 'custrecord_master_record_type',
								value: recType
							});

							masterId = custRec.save();

							// Push array of objects into reduce stage

							for (var l = 0; l < results.length; l++) {
								var scriptid = results[l].getValue({
									name: 'internalid',
									join: 'script'
								});
								if (scriptid) {

									result.push({
										id: scriptid,
										type: 'script',
										masterId: masterId,
										parseType: parseType,
										recordType: parseRecords
									})
								}

							}
						}

					}
					break;
				case 'internalid':
					if (parseRecords) {
						custRec.setValue({
							fieldId: 'custrecord_master_record_type',
							value: 'Individual Script Parsed'
						});

						masterId = custRec.save();
						splitScriptIds = parseRecords.split();
						for (var j = 0; j < splitScriptIds.length; j++) {
							result.push({
								id: splitScriptIds[j],
								type: 'script',
								masterId: masterId,
								parseType: parseType
							});
						}
					}
					if (fileIds) {
						splitFileIds = fileIds.split();
						for (var k = 0; k < splitFileIds.length; k++) {
							result.push({
								id: splitFileIds[k],
								type: 'file',
								masterId: masterId
							});
						}
					}
					break;

				default:
					//log.debug('parse by', parseType);
					break;
			}

			//log.debug('end getinput');

			// this return is what gets passed to _reduce this is an array and will spawn as many reduce stages as there are objects in the array
			return result;
		}

		/** Flow:
		 *  -> Call _extractScript function - Extract script and dependencies into an object
		 *  -> Call _extractFunctions function - Builds a more readable waterfall type of hierarchy
		 *  -> Call convertToHTML function - Outputs the parsed operations into a readable HTML log
		 *
		 *  Format:
		 *  var script= {};
		 script.mainFunction = syntax.body[0].expression.arguments[1]; //the main function
		 script.scriptFunctions = syntax.body[0].expression.arguments[1].body.body; //array of all the functions, global variables, return statement
		 script.dependencies = new Array(); //array of dependencies
		 script.name = fileContents.name;
		 script.functionList // array of operations and functions
		 var functionDetails = {}; // object that contains operation details
		 functionDetails.functionName = allFunctions[i].id.name // name of function
		 functionDetails.operations = new Array(); //operations of function
		 script.parsedParameters = new Array();
		 parsedParameters.native
		 parsedParameters.value
		 parsedParameters.name
		 */
		function _reduce(context) {
			var functions_map, loop_array, operation_array, search_array = new Array();
			var LOG_TITLE,
				astObj,
				ctxObj,
				fileObj,
				sources,
				internalId,
				id,
				result,
				main,
				scriptFile,
				masterId

			try {
				// initializing new object
				var parsedObj = {};
				// will contain a list of functions which are properties of parseobj
				parsedObj.functions = new Array();

				LOG_TITLE = PREFIX + 'reduce';

				// the values of the context object are strings and they need to be converted to an object via JSON.parse, gives you the properties of the object
				id = JSON.parse(context.values[0]);
				//log.debug(LOG_TITLE, 'ctxObj=' + JSON.stringify(id.id));

				// sets the script masterid to the masterid of the master parser custom record
				masterId = id.masterId;
				log.debug('masterId', masterId);

				// Get the metadata about the script from the script record
				if (id && id.type == 'script') {
					result = search.lookupFields({
						columns: ['scriptfile', 'apiversion', 'defaultfunction', 'name', 'scripttype'],
						type: 'script',
						id: id.id
					});
					//scriptName
					scriptFile = result.scriptfile[0].text
					log.debug('reduce: ', 'scriptFile: ' + scriptFile);
					main = _extractScript(scriptFile, result.apiversion, true, id.id);
				} else {
					result = search.lookupFields({
						columns: ['name', 'scripttype'],
						type: 'file',
						id: id.id
					});
					main = _extractScript(scriptName, result.apiversion, true, id.id);
				}

				if (!main)
					return;

				for (var j = 0; j < main.entryFunctions.length; j++) {
					if (main.entryFunctions[j].value) //2.0 scripts
						extractFunctions(main, main.entryFunctions[j].value, parsedObj, 0, true);
					else //1.0 scripts
						extractFunctions(main, main.entryFunctions[j], parsedObj, 0), true;

				}

				////log.debug('main', main.lines);
				var numLines = main.lines;
				var totalLibraryLineCount = 0;
				totalLibraryLineCount = getLibLineCount(main, totalLibraryLineCount);
				var lineObj = {};
				lineObj.main = numLines;
				lineObj.lib = totalLibraryLineCount;

				//FE: 4/15/20 - Issues 6 & 7 - On each operation determine the parent and if it´s inside a loop
				if(main && main.functionList && parsedObj && parsedObj.functions) {
					var operations = main.functionList.map(function(f){ return f.operations; });
					operations = [].concat.apply([], operations);

					for (var i = 0; i < parsedObj.functions.length; i++) {
						var obj = parsedObj.functions[i];

						var functionName = obj.fname || (obj.operation && obj.operation.method);
						if (functionName == '') continue;

						var parent = operations.filter(function (f) {
							return f.method == functionName || (f.callee && f.callee.name == functionName || (f.init && f.init.callee && f.init.callee.name == functionName))
						}).map(function (x) {
							return x.parent
						});
						var loop = operations.filter(function (f) {
							return f.method == functionName || (f.callee && f.callee.name == functionName || (f.init && f.init.callee && f.init.callee.name == functionName))
						}).map(function (x) {
							return x.loop;
						});
						obj.parent = obj.parent || (parent && parent[0]);
						obj.loop = obj.loop || (loop && loop[0]);
					}
				}
				//End Issues 6 & 7

				//document data in custom record
				var summary = getSummary(parsedObj);
				summary.lineCount = lineObj;
				//log.debug('grade', summary.initGrade);

				var lines = '';
				lines += "The main file has: " + numLines + " lines \n";

				if (lineObj.lib == 0 || lineObj.lib == null)
					lines += "There are no library files for this script";
				else
					lines += "The library files have a combined line count of: " + lineObj.lib + " \n";

				log.debug('result!!!!!!!!', result);

				var custRec = record.create({
					type: 'customrecord_parse_details',
					isDynamic: true
				});
				custRec.setValue({
					fieldId: 'custrecord_parse_script_name',
					value: result.name
				});
				custRec.setValue({
					fieldId: 'custrecord_parse_script_version',
					value: result.apiversion
				});
				if (result.scripttype)
					custRec.setValue({
						fieldId: 'custrecord_parse_script_type',
						value: result.scripttype[0].text
					});
				custRec.setValue({
					fieldId: 'custrecord_parse_script_id',
					value: id.id
				});
				custRec.setValue({
					fieldId: 'custrecord_parse_file_name',
					value: scriptFile
				});
				custRec.setValue({
					fieldId: 'custrecord_parse_info',
					value: convertToHTML(parsedObj)
				});
				custRec.setValue({
					fieldId: 'custrecord_parse_grading',
					value: summary.initGrade
				});
				if (summary.summary)
					custRec.setValue({
						fieldId: 'custrecord_parse_summary',
						value: summary.summary
					});
				else
					custRec.setValue({
						fieldId: 'custrecord_parse_summary',
						value: 'No heavy operations found'
					});
				if (summary.usage)
					custRec.setValue({
						fieldId: 'custrecord_parse_governance_use',
						value: summary.usage
					});
				else
					custRec.setValue({
						fieldId: 'custrecord_parse_governance_use',
						value: 'No significant governance usage found'
					});
				custRec.setValue({
					fieldId: 'custrecord_total_usage_count',
					value: summary.totalUsage
				});
				custRec.setValue({
					fieldId: 'custrecord_summary_num_lines',
					value: lines
				});
				custRec.setValue({
					fieldId: 'custrecord_parent_master_summary',
					value: masterId
				});

				//FE: 4/15/20: Prevent exceeding 4000 characters
				var recommendation = summary.recommendation? summary.recommendation.substr(0, 3999): '';
				custRec.setValue({
					fieldId: 'custrecord_parse_api_efficiency',
					value: recommendation
				});
				custRec.setValue({
					fieldId: 'custrecord_total_operations_found',
					value: summary.apiCount
				});
				custRec.setValue({
					fieldId: 'custrecord_total_rec_count',
					value: summary.recCount
				});
				id = custRec.save();

				context.write({
					key: id,
					value: summary
				});
			} catch (e) {

				log.error('Error in parsing script', masterId + ', ' + id.id);
				var err = "Cannot parse script: " + id.id + " with error - " + e.toString() + "\n";
				if (masterId) {
					context.write({
						key: masterId,
						value: err
					});
				}

			}


		} //end reduce


		function getLibLineCount(script, count) {
			for (var x in script.dependencies) {
				var lib = script.dependencies[x];
				if (lib)
					count += lib.lines;
				if (lib && lib.dependencies && lib.dependencies.length > 0) {
					count += getLibLineCount(lib, count)
				}
			}
			return count;

		}

		/**
		 * #1 function called
		 * Extract the script contents and it's dependencies into a parsed object
		 * Loops through each function and child functions to extract the operations
		 *
		 * fileName -> file name of script
		 * apiversion -> 1.0, 2.0
		 * main -> if is the main script
		 * id -> internal id of script
		 */

		//Pass in the information from the script record
		function _extractScript(fileName, apiversion, main, id) {

			var globalVariables = new Array();
			var allOperations = new Array();
			/*
			 * Main objects
			 */
			var script = {};
			script.scriptFunctions = new Array();
			const title = '_extractScript';

			//arrays of standard and custom libraries
			var fileId = _getFileIdFromName({
				name: fileName
			});
			try {
				// file is a standard netsuite module
				var fileObj = file.load({
					id: fileId
				});
			} catch (e) {
				log.error('file is locked, cannot load - skipping', fileName);
				return;
			}

			var fileContents = {
				id: fileObj.id,
				// removes .js from the file name
				name: fileObj.name.slice(0, -3),
				content: fileObj.getContents(),
				folder: fileObj.folder
			}
			log.audit('_extractScript', 'file name: ' + fileContents.name);
			// converts file contents into a parsable object, loc will display the line numbers
			var syntax = esprima.parseModule(fileContents.content, {
				loc: true
			});
			log.debug('apiversion', apiversion);


			//ST. 1.0 APIs
			if (apiversion == '1.0' || apiversion == 1.0) {
				script.apiversion = '1.0';
				// Get line count
				if (syntax.loc)
					script.lines = syntax.loc.end.line - syntax.loc.start.line;
				for (var g = 0; g < syntax.body.length; g++) {
					//	log.debug('syntax body: ' + g, syntax.body[g]);

					// pushing everything into the array, could have done script.scriptFunctions = syntax.body
					script.scriptFunctions.push(syntax.body[g]);
				}
				// main will be true or null, the main script from the script record
				if (main) { //the main 1.0 script file
					// For 1.0 must load script record to get the library files, which are listed in the sublist
					var rec = record.load({
						type: 'script',
						id: id
					});

					script.entryFunctions = new Array();

					// for scheduled scripts, suitelets, etc. the entry function will be called defaultfunction, for user events the entry will have different names
					var defaultFunction = rec.getValue({
						fieldId: 'defaultfunction'
					});
					if (defaultFunction) {
						// defaultfunction.test or similar handling
						if (defaultFunction.indexOf(".") > -1) {
							var a = {};
							defaultFunction = defaultFunction.split(".");
							a.object = defaultFunction[0];
							a.property = defaultFunction[1];
							script.entryFunctions.push(a);
						} else
							script.entryFunctions.push(defaultFunction);
					} else {
						//user event
						var beforeLoad = rec.getValue({
							fieldId: 'beforeloadfunction'
						});
						var beforeSubmit = rec.getValue({
							fieldId: 'beforesubmitfunction'
						});
						var afterSubmit = rec.getValue({
							fieldId: 'aftersubmitfunction'
						});

						//client side
						var pageInit = rec.getValue({
							fieldId: 'pageinitfunction'
						});
						var saveRecord = rec.getValue({
							fieldId: 'saverecordfunction'
						});
						var validateField = rec.getValue({
							fieldId: 'validatefieldfunction'
						});
						var fieldChanged = rec.getValue({
							fieldId: 'fieldchangedfunction'
						});
						var postSourcing = rec.getValue({
							fieldId: 'postsourcingfunction'
						});
						var lineInit = rec.getValue({
							fieldId: 'lineinitfunction'
						});
						var validateLine = rec.getValue({
							fieldId: 'validatelinefunction'
						});
						var validateInsert = rec.getValue({
							fieldId: 'validateinsertfunction'
						});
						var validateDelete = rec.getValue({
							fieldId: 'validatedeletefunction'
						});
						var recalc = rec.getValue({
							fieldId: 'recalcfunction'
						});

						// push the name of the function into the array
						if (pageInit) script.entryFunctions.push(pageInit);
						if (saveRecord) script.entryFunctions.push(saveRecord);
						if (validateField) script.entryFunctions.push(validateField);
						if (fieldChanged) script.entryFunctions.push(fieldChanged);
						if (postSourcing) script.entryFunctions.push(postSourcing);
						if (lineInit) script.entryFunctions.push(lineInit);
						if (validateLine) script.entryFunctions.push(validateLine);
						if (validateInsert) script.entryFunctions.push(validateInsert);
						if (validateDelete) script.entryFunctions.push(validateDelete);
						if (recalc) script.entryFunctions.push(recalc);

						if (beforeLoad) {
							// handles weirdness of beforeload.test etc.
							if (beforeLoad.indexOf(".") > -1) {
								var a = {};
								beforeLoad = beforeLoad.split(".");
								a.object = beforeLoad[0];
								a.property = beforeLoad[1];
								script.entryFunctions.push(a);
							} else
								script.entryFunctions.push(beforeLoad);
						}

						if (beforeSubmit) {
							if (beforeSubmit.indexOf(".") > -1) {
								var a = {};
								beforeSubmit = beforeSubmit.split(".");
								a.object = beforeSubmit[0];
								a.property = beforeSubmit[1];
								script.entryFunctions.push(a);
							} else
								script.entryFunctions.push(beforeSubmit);
						}
						if (afterSubmit) {
							if (afterSubmit.indexOf(".") > -1) {
								var a = {};
								beforeLoad = afterSubmit.split(".");
								a.object = afterSubmit[0];
								a.property = afterSubmit[1];
								script.entryFunctions.push(a);
							} else
								script.entryFunctions.push(afterSubmit);
						}
					}
					// passes list of libraries to script.dependencies
					script.dependencies = new Array(); //; 1.0 library files
					for (var q = 0; q < rec.getLineCount({
						sublistId: 'libraries'
					}); q++) {
						//VA - read 1.0 libraries
						var libraryId = rec.getSublistValue({
							sublistId: 'libraries',
							//fieldId: 'scriptfile_display',
							fieldId: 'scriptfile',
							line: q
						});
						var objLibraryFile = file.load({
							id: libraryId
						});
						var libraryName = objLibraryFile.name;
						log.audit('libraryName_1.0: ', 'libraryName: ' + libraryName);
						script.dependencies.push(_extractScript(libraryName, '1.0', false));
					} //VA end

					log.debug('script.entryFunctions', script.entryFunctions);
				}

			}
			//2.0 APIs
			else {
				script.apiversion = '2.0';
				// pulls the array of modules
				var scriptDependencies = syntax.body[0].expression.arguments[0];
				// pulls main function
				script.mainFunction = syntax.body[0].expression.arguments[1]; //the main function
				// could have been script.mainFunction.body.body gives you all of the functions in the script
				script.scriptFunctions = syntax.body[0].expression.arguments[1].body.body; //array of all the functions, global variables, return statement
				//gives script line count
				if (syntax.body[0].loc && syntax.body[0].loc.start) {
					script.lines = syntax.body[0].loc.end.line - syntax.body[0].loc.start.line;
				}
				//actually load the library file
				script.dependencies = new Array(); //array of dependencies
				script.name = fileContents.name;
				script.parameters = script.mainFunction.params; // list of arguments for main function
				script.parsedParameters = new Array(); //array of parameter objects
				script.entryFunctions;
				var functionArguments = scriptDependencies.elements; //list of arguments in the define
				//checking if standard NS or custom lib file
				// obj object has attributes of native, value and name
				for (var l = 0; l < functionArguments.length; l++) {
					var obj = {};

					if (functionArguments[l].value.indexOf('N/') > -1) {
						log.debug(title, 'is a native module');
						obj.native = true;
					} else {
						log.debug(title, 'not a native module');
						obj.native = false;
					}
					obj.value = functionArguments[l].value;
					obj.name = script.parameters[l].name;
					log.debug('parsedParam value', obj.value);
					log.debug('parsedParam name', obj.name);
						script.parsedParameters.push(obj);
				}

				// getting the file names for the non native modules/libraries
				for (var k = 0; k < script.parsedParameters.length; k++) {
					var val = script.parsedParameters[k];
					if (val.native == false) {
						var scriptName;
						var index = val.value.lastIndexOf("/");
						//log.debug('lastIndexOf("/")',val.value.lastIndexOf("/") );
						if (index > -1)
							scriptName = val.value.substr(index + 1) + ".js";
						else
							scriptName = val.value + ".js";
						log.debug('_extractScript scriptName', scriptName);
						log.debug(title, 'Is not a native module, pushing to dependencies array');
						script.dependencies.push(_extractScript(scriptName, apiversion, false));
					}
				}

				//check for return statement
				// will only return true if the elem.type is equal to NAMES.RETURN_STATEMENT and will only store it in the returnstatement array
				returnStatement = script.scriptFunctions.filter(function (elem, index, array) {
					return elem.type === NAMES.RETURN_STATEMENT;
				});

				//extract entry functions
				// returns outer most return functions properties could have done entryFunctions=returnStatement[0].argument.properties
				if (entryFunctions = returnStatement[0].argument.properties) {
					entryFunctions = returnStatement[0].argument.properties.filter(function (elem, index, array) {

						return elem;
					});
				};

				script.entryFunctions = entryFunctions;
			}

			//End 1.0 and 2.0 difference

			//the entry functions of the script
			//log.debug('script.entryFunctions', script.entryFunctions);
			var allFunctions = new Array();
			var globalValues = new Array();
			// map is native javascript to loop through the array
			script.scriptFunctions.map(function (elem, index, array) {
				var type = elem.type;
				// find all variable declarations
				if (type === NAMES.VARIABLE_DECLARATION && elem.declarations) {
					for (var x in elem.declarations) {
						var dec = elem.declarations[x];
						// find functions that have been assigned to a variable
						if (dec.init && dec.init.type === NAMES.FUNCTION_EXPRESSION) {
							//variable
							var id = {};
							id.type = NAMES.FUNCTION_EXPRESSION;
							// if dec.id === dec.id.name then dec.id.name else ''
							id.name = dec.id ? dec.id.name : '';
							dec.init.id = id; //2-26-2019 - adding the id to the object;
							allFunctions.push(dec.init);
						}
						// if it's not a function it's a global value (literals, constants, etc.)
						else
							globalValues.push(elem);
					}
					//return true;
					//log.debug('variable declaration', elem);
				}
				// find all expression statements
				else if (type === NAMES.EXPRESSION_STATEMENT) {
					// all functions that have been assigned to a variable
					if (elem.expression &&
						elem.expression.type === NAMES.ASSIGNMENT_EXPRESSION &&
						elem.expression.right &&
						elem.expression.right.type === NAMES.FUNCTION_EXPRESSION) {
						//assigned to object property
						var id = {};

						if (elem.expression.left && elem.expression.left.object) {
							id.type = NAMES.MEMBER_EXPRESSION;
							id.name = elem.expression.left.object ? elem.expression.left.object.name : '';
							id.property = elem.expression.left.property ? elem.expression.left.property.name : '';
						}
						//assigned to variable
						else {
							id.type = NAMES.MEMBER_EXPRESSION;
							id.name = elem.left ? elem.left.name : '';
						}

						elem.expression.right.id = id; //2-26-2019 - adding the id to the object;
						allFunctions.push(elem.expression.right); //TODO add the initiator
						//log.debug('elem.expression.right', elem.expression.right);
					}

				}
				// make sure we have the variable declaration for all assignment expressions
				else if (type === NAMES.EXPRESSION_STATEMENT &&
					elem.expression &&
					elem.expression.type == NAMES.ASSIGNMENT_EXPRESSION) {
					//Check expression type. If assignment expression, find the variable name from array
					for (var x = 0; x < index; x++) {
						var val = array[x];
						if (val.type == NAMES.VARIABLE_DECLARATION && val.declarations) {
							for (var y in val.declarations) {
								var dec = val.declarations[y];
								if (dec &&
									dec.id &&
									elem.expression &&
									elem.expression.left &&
									dec.id.name == elem.expression.left.name) {
									globalValues.push(elem);
								}
							}
						}
					}
				} else if (type === NAMES.FUNCTION_DECLARATION)
					allFunctions.push(elem);
			});

			//log.debug('globalValues length', globalValues);

			// find the netsuite API's in the global values, a helper function that calls the main core logic
			var globalArr = extMemberExpr(globalValues);
			if (globalArr) {
				script.globalValues = globalArr.operations;
				//log.debug('script.globalValues length', script.globalValues.length);
			}

			script.functionList = new Array(); //list of functions and their APIs
			for (var i = allFunctions.length - 1; i >= 0; i--) {
				if (!allFunctions[i]) return;
				//log.audit('allFunctions[i]', allFunctions[i]);
				//path object contains information about the operations, loops, etc inside the function
				var functionDetails = {}; // object that contains operation details
				functionDetails.functionName = allFunctions[i].id ? allFunctions[i].id.name : ''; // name of main function
				functionDetails.property = allFunctions[i].id ? allFunctions[i].id.property : '';
				functionDetails.operations = new Array(); //operations of the main function
				functionDetails.globalOperations = allOperations;
				functionDetails.params = allFunctions[i].params; //check for parameters of function
				functionDetails.globalScriptValues = script.globalValues;
				functionDetails.returnValues = new Array();
				var funcloc = allFunctions[i].loc; //get the line count of the function
				if (funcloc && funcloc.start && funcloc.end) {
					functionDetails.linecount = funcloc.end.line - funcloc.start.line;
				}
				//end path object
				//loop through function to get all API calls
				var scriptBody = allFunctions[i].body.body

				////log.debug('functionDetails.functionName', functionDetails.functionName);
				////log.debug('scriptBody', scriptBody);

				for (var j = 0; j < scriptBody.length; j++) {
					//getting all the variables, functions, etc.
					var ops = buildTree(scriptBody[j], functionDetails, false, script.parsedParameters, false);
					for (var u in ops) {
						if (ops[u] && ops[u].settingGlobalVar == true)
							//log.debug('ops[u]', ops[u]);
							allOperations.push(ops[u]); //TODO check only if setting a global variable?
					}
				}
				//log.debug('functionDetails.returnValues', functionDetails.returnValues);

				script.functionList.push(functionDetails);
				//end function loop
			}

			script.name = fileContents.name;

			//Logging
			//log.debug(title + ', functionDetails APIs: ', script.functionList);
			//log.debug(title + ', return statement', JSON.stringify(returnStatement));
			//log.debug(title + ', all functions', JSON.stringify(allFunctions));
			//log.debug(title + ', entry functions', JSON.stringify(entryFunctions));
			//log.debug(title + ', allFunctions length, ', allFunctions.length)
			//log.debug(title + ', globalVariables', JSON.stringify(globalValues));
			//End Logging

			return script;
		}

		/**
		 * #2 function called
		 * Check each line
		 */
		function buildTree(obj, functionDetails, loop, modules, condition) {

			const title = 'buildTree';
			var lineObj = {};
			//the firstBlock
			if (Array.isArray(obj)) {
				for (x in obj) {
					buildTree(obj[x], functionDetails, loop, modules, condition);
				}
				return;
			}

			if (obj.type == NAMES.TRY_STATEMENT) {
				buildTree(obj.block, functionDetails, loop, modules, condition);
			} else if (obj.type == NAMES.BLOCK_STATEMENT) {
				buildTree(obj.body, functionDetails, loop, modules, condition);
			} else if (obj.type == NAMES.RETURN_STATEMENT) {
				var returnVal, value;
				if (obj.argument && obj.argument.type == NAMES.IDENTIFIER) {
					returnVal = obj.argument.name;

					//look for return value
					for (v = functionDetails.operations.length - 1; v >= 0; v--) {
						var op = functionDetails.operations[v];
						if (!op) continue;
						if (op.assign &&
							op.assign.name == returnVal) {
							//log.debug('return statement:',JSON.stringify(op) );
							functionDetails.returnValues.push(op);
						}

					}
				} else if (obj.argument && obj.argument.type == NAMES.LITERAL)
					value = obj.argument.value;
			} else if (obj.type == NAMES.IF_STATEMENT) {
				//log.debug(title + ', IF STATEMENT: ', obj);
				var condition = {};
				condition = 'if';
				buildTree(obj.consequent, functionDetails, loop, modules, condition);
				//else if statements
				if (obj.alternate) {
					condition = 'elseif';
					buildTree(obj.alternate, functionDetails, loop, modules, condition);
				}

			} else if (obj.type == NAMES.SWITCH_STATEMENT) {
				//log.debug('switch obj', obj);
				//will pass an array of switch cases
				if (obj.cases)
					buildTree(obj.cases, functionDetails, loop, modules, condition);
			} else if (obj.type == NAMES.SWITCH_CASE) {
				//log.debug('switch case', obj);
				var condition = 'switch';
				buildTree(obj.consequent, functionDetails, loop, modules, condition);
			} else if (obj.type == NAMES.DO_WHILE) {
				//pass body of do while loop to parse
				buildTree(obj.body, functionDetails, true, modules, condition);
			} else if (obj.type == NAMES.WHILE_STATEMENT) {
				buildTree(obj.body, functionDetails, true, modules, condition);
			} else if (obj.type == NAMES.FOR_STATEMENT) {
				var forStatement = obj.body;
				if (forStatement.body) {
					//loops through each line inside the for loop
					for (var l = 0; l < forStatement.body.length; l++) {
						buildTree(forStatement.body[l], functionDetails, true, modules, condition);
					}
				}
			} else if (obj.type == NAMES.OBJECT_EXPRESSION) {
				//functionDetails.operations.push({"type":"Literal","name":"rec_type","value":"PREFERENCE_CACHE"});
				////log.debug('object expression', obj);
			}

			//DG 1-24-2019 - All we care about recording are variable declarations, call expressions
			else if (obj.type == NAMES.EXPRESSION_STATEMENT) {
				var expression = obj.expression;
				if (expression) {
					//log.debug(title + ', going into call expression',expression);
					buildTree(expression, functionDetails, loop, modules, condition);
				}
			}

			//DG There can be more than one declaration per line
			else if (obj.type == NAMES.VARIABLE_DECLARATION) {
				if (obj.declarations) {
					for (var o in obj.declarations) {
						buildTree(obj.declarations[o], functionDetails, loop, modules, condition);
					}
				}
			} else if (obj.type == NAMES.VARIABLE_DECLARATOR ||
				obj.type == NAMES.ASSIGNMENT_EXPRESSION ||
				obj.type == NAMES.CALL_EXPRESSION) {
				if (obj.callee && obj.callee.property && (
					obj.callee.property.name == 'forEach' ||
					obj.callee.property.name == 'map' ||
					obj.callee.property.name == 'reduce' ||
					obj.callee.property.name == 'filter'
				)) {
					if (obj.arguments.length > 0 && obj.arguments[0] &&
						obj.arguments[0].body) {
						buildTree(obj.arguments[0].body, functionDetails, loop, modules, condition);
					}
				}

				//2-22-2019
				//if assignment expression, check if it is declared in function, if not check global variables
				//if it is setting a global variable, push it to global operations
				var settingGlobalVar = false;

				if (obj.type == NAMES.ASSIGNMENT_EXPRESSION) {
					//functionDetails
					settingGlobalVar = isSettingGlobalVar({
						functionDetails: functionDetails,
						op: obj
					});
				}

				//There can be different values assigned to a variable declaration, for example:
				//call expression ex. record.submit();
				//member expression ex. record.Type.SALES_ORDER
				//literal ex. 'salesorder'
				//check forEach 1-9-2018
				//log.debug('buildTree obj', obj);

				var result = extractExpressionInformation(obj, modules, functionDetails);

				if (settingGlobalVar)
					result.settingGlobalVar = settingGlobalVar;

				var nsmod = extModule(result, modules);

				if (nsmod)
					result.nsmod = nsmod;

				if (loop)
					result.loop = loop;

				//log.debug('result', result);

				//FE: 4/15/20 - Issues 6 & 7 - need to identify the parent function to check later if it´s inside a loop
				result.parent = functionDetails.functionName;

				if (obj.arguments) {
					result.params = obj.arguments //parameters of the function call
				}

				functionDetails.operations.push(result);
			}

			//for example test.member, rec.val
			else if (obj.type == NAMES.MEMBER_EXPRESSION) {

				var result = extractExpressionInformation(obj, modules, functionDetails);
				//log.debug('member expression: ',result);
			}
			//END DG 1-24-2019

			return functionDetails.operations;
		}

		function isSettingGlobalVar(obj) {

			var operation = obj.op;
			var functionDetailList = obj.functionDetails;
			//log.debug('operation', operation);
			//log.debug('functionDetailList', functionDetailList);
			if (functionDetailList &&
				functionDetailList.operations &&
				functionDetailList.operations.length > 0) {
				var localValues = functionDetailList.operations;
				for (var x in localValues) {

					if (localValues[x] &&
						operation.left &&
						operation.left.name == localValues[x].name)
						return false;

				}
			}
			if (functionDetailList &&
				functionDetailList.globalScriptValues &&
				functionDetailList.globalScriptValues.length > 0) {
				var globalValues = functionDetailList.globalScriptValues;
				for (var u in globalValues) {
					if (globalValues[u] &&
						operation.left &&
						(
							operation.left.name == globalValues[u].name ||
							(globalValues[u].id &&
								operation.left.name == globalValues[u].id.name)
						)) {

						//log.debug('setting global variable', globalValues[u]);
						return true;

					}
				}
			} else {

				//log.debug('script does not have any global variables, exiting');

			}
			return false;
		}

		//Checks if operation is a save operation
		//if it is a save operation, find the variable that contains the record load
		//check both operations/variables inside the script context and global variables
		function chkRecSave(obj) {

			var title = 'chkRecSave';
			var current = obj.current;
			var operations = obj.operations.operations;
			var globalOperations = obj.operations.globalOperations;
			var params = obj.operations.params;
			var currentFunction = obj.operations.functionName;

			//print out logs
			//log.audit('current', current);
			//log.audit('globalOperations', globalOperations);
			//log.audit('operations', operations);
			//log.audit('params', params);

			for (var i = 0; i < operations.length; i++) {

				var operation = operations[i];

				var val = operation.right ? operation.right : operation.init;

				if (!val) val = operation;

				//log.audit('local operation: ', operation);

				var assign = operation.left ? operation.left : operation.id;

				//log.debug('assign: ', assign);

				//For complex scenarios, ex:  test.myFunction = function(){return val}
				if (val &&
					val.callee &&
					val.callee.object &&
					val.callee.object.property) {

					val = val.callee.object.property;

				} else if (val &&
					val.callee &&
					val.callee.property &&
					val.callee.property.returnValue) {

					val = val.callee.property;

					//log.debug('callee: ',val);

				} else if (val &&
					val.callee &&
					val.callee &&
					val.callee.returnValue) {

					val = val.callee;

					if ((current.object &&
						assign &&
						assign.name == current.object.name) ||
						(assign &&
							assign.name == current.type &&
							current.name == 'nlapiSubmitRecord')
					) {
						val = val.returnValue;
						val.saveFound = true;
						//log.debug('found save value', val);
						return {
							type: val.type,
							nsmod: val.nsmod
						};

					}

					//log.debug('callee: ', val);
				}


				if (val &&
					val.assign &&
					val.nsmod && //TODO 3-4-2019
					((current.object &&
						val.assign &&
						val.assign.name == current.object.name
					) ||
						(val.assign &&
							val.assign.name == current.type &&
							current.name == 'nlapiSubmitRecord'
						)
					)
				) {

					val.saveFound = true;
					//log.debug('found save value', val);
					return {
						type: val.type,
						nsmod: val.nsmod
					};

				}

			}

			var paramName;
			var paramIndex;

			//check parameters
			if (params) {
				for (var x = 0; x < params.length; x++) {
					var param = params[x];
					if (param &&
						param.name &&
						current.object &&
						current.object.name &&
						current.object.name == param.name) {
						paramName = param.name;
						paramIndex = x;
					}

				}
			}

			//log.audit('paramName', paramName);

			//log.audit('currentFunction', currentFunction);

			//if there are no variables within the function context, check for global variables
			if (!globalOperations) return;

			var globalParam;
			var globalName;

			for (var i = globalOperations.length - 1; i > 0; i--) {

				var operation = globalOperations[i];

				//log.audit('global operation: ', operation);

				var val = operation.right ? operation.right : operation.init;

				if (!val) val = operation;

				//if there are no global or local load/create operations, check the parameter

				//1. check function parameter if same as name
				//2. find in global operations
				if (currentFunction &&
					val &&
					val.callee &&
					val.callee.name) {

					var globalParams = operation.params;

					if (globalParams.length > 0 &&
						paramIndex >= 0) {
						globalParam = globalParams[paramIndex];

						if (globalParam) {
							globalName = globalParam.name;
							//log.audit('found global name', globalName);
						}


					}
				}


				var assign = operation.left ? operation.left : operation.id;

				//log.audit('assign: ', assign);

				//For complex scenarios, ex:  test.myFunction = function(){return val}
				if (val &&
					val.callee &&
					val.callee.object &&
					val.callee.object.property) {

					val = val.callee.object.property;

				} else if (val &&
					val.callee &&
					val.callee.property &&
					val.callee.property.returnValue) {

					val = val.callee.property;

					//log.audit('callee: ',val);

				} else if (val &&
					val.callee &&
					val.callee &&
					val.callee.returnValue) {

					val = val.callee;

					if ((current.object &&
						assign &&
						assign.name == current.object.name) ||
						(assign &&
							assign.name == current.type &&
							current.name == 'nlapiSubmitRecord')
					) {
						val = val.returnValue;
						val.saveFound = true;
						//log.debug('found save value', val);
						return {
							type: val.type,
							nsmod: val.nsmod
						};

					}

					//log.audit('callee: ', val);
				}

				//log.audit('val:!', val);
				//log.audit('globalName: ', globalName);
				if (val &&
					val.assign &&
					val.nsmod && //TODO 3-4-2019
					(
						val.assign &&
						val.assign.name == globalName
					)
				) {

					val.saveFound = true;
					//log.audit('found save value', val);
					return {
						type: val.type,
						nsmod: val.nsmod
					};

				}

				if (val &&
					val.assign &&
					val.nsmod && //TODO 3-4-2019
					((current.object &&
						val.assign &&
						val.assign.name == current.object.name) ||
						(val.assign &&
							val.assign.name == current.type &&
							current.name == 'nlapiSubmitRecord')
					)
				) {

					val.saveFound = true;
					//log.debug('found save value', val);
					return {
						type: val.type,
						nsmod: val.nsmod
					};

				}

				if (val &&
					val.arguments &&
					((current.object &&
						val.arguments &&
						val.arguments.name == current.object.name) ||
						(val.arguments &&
							val.arguments.name == current.type &&
							current.name == 'nlapiSubmitRecord')
					)
				) {

					val.saveFound = true;
					//log.debug('found save value', val);
					return {
						type: val.type,
						nsmod: val.nsmod
					};

				}

			}

			return null;
		}

		function extMemberExpr(obj) {
			var ops = {};
			ops.operations = new Array();
			buildTree(obj, ops, null, null);
			//log.debug('extMemberExpr', ops);
			return ops;
		}

		/**
		 * extractExpressionInformation
		 * 1. Checks if it is a NetSuite module or not
		 * 2. If it is a NetSuite module, extract data, parameters, etc.
		 * 3. If cannot extract data type, parameters, etc. then try again in phase 2
		 * 4. If it is a custom module, then set flat to try in again in phase 2
		 * Check each line
		 */
		function extractExpressionInformation(obj, modules, functionDetails) {

			//check if member expression ex. test.test2.test3
			//check if call expression ex. test.test2.test()

			//initiate variables for checking if it is a netsuite call or a library call
			var isNetSuiteAPI = false;
			var isLibraryFileCall = false;

			//declare variables
			var callee;
			var memberObject;
			var main;
			//the variable the expression is assigned to
			var assign;

			var apiversion = '1.0';

			if (modules) {
				//log.debug('modules', modules);
				apiversion = '2.0';
			}

			//if obj.right or obj.init, both have same contents
			//one is coming from a a variable declaration, and one is from an assignment
			main = obj.right ? obj.right : obj.init;

			if (!main && obj.type == NAMES.CALL_EXPRESSION)
				main = obj;

			assign = obj.left ? obj.left : obj.id;

			if (main) {

				//For 1.0 scripts and function calls within same script
				if (main.type &&
					main.type == NAMES.CALL_EXPRESSION &&
					main.callee &&
					main.callee.name) {

					var callee = main.callee;

					if (callee.name.indexOf('nlapi') > -1) {

						//log.debug('1.0 api call');
						//Generate NetSuite object
						var apiObj = {};
						apiObj.module = '';
						apiObj.method = callee.name;
						apiObj.isNetSuiteAPI = !isNetSuiteAPI;

						//Set the variable the expression is assigned to
						apiObj.assign = assign;

						//set the line number
						if (callee.loc)
							apiObj.lineStart = callee.loc.start;

						//parse the parameters
						if (main.hasOwnProperty("arguments")) {
							var params = extFuncParam(main.arguments, apiObj.method);
							//log.debug('param', params);
						}

						try {
							if (params) {
								if (params.recordType) {
									params.recordType = extRecTypev2(params);
								}
								apiObj.type = params.recordType;
								apiObj.paramType = params.paramType;
							}
						} catch (e) {
							log.error('error in getting parameters', e);
							log.error('line 721');
						}

						//get the record type of the NetSuite operation
						apiObj.type = extRecType(apiObj, functionDetails.operations, true) || apiObj.type;

						return apiObj;
					}

				}

				//if obj.right.callee, then there is a call expression
				if (main.type == NAMES.CALL_EXPRESSION &&
					main.callee) {

					callee = main.callee;
					var methodName = callee.property ? callee.property.name : '';
					//TODO should we check for type as well? ex. identifier
					if (callee.hasOwnProperty("object")) {

						var expObj = callee.object;
						//for example. expr.expr.test() is not a NetSuite API
						if (expObj.hasOwnProperty("object")) {

							obj.isNetSuiteAPI = isNetSuiteAPI;
							return obj;

						}
						//check 2.0 modules
						else if (modules && modules.length > 0) {

							for (var v in modules) {

								var module = modules[v];
								if (module.native &&
									module.name == expObj.name) {

									//Generate NetSuite object
									var apiObj = {};
									apiObj.module = module.name;
									apiObj.method = methodName;
									apiObj.isNetSuiteAPI = !isNetSuiteAPI;

									//Set the variable the expression is assigned to
									apiObj.assign = assign;

									//set the line number
									if (expObj.loc)
										apiObj.lineStart = expObj.loc.start;

									//parse the parameters
									if (main.hasOwnProperty("arguments")) {
										var params = extFuncParam(main.arguments, apiObj.method);
										//log.debug('param', params);
									}

									try {
										if (params) {
											if (params.recordType) {
												params.recordType = extRecTypev2(params);
											}
											apiObj.type = params.recordType;
											apiObj.paramType = params.paramType;
										}
									} catch (e) {
										log.error('error in getting parameters', e);
										log.error('line 721');
									}

									//get the record type of the NetSuite operation
									apiObj.type = extRecType(apiObj, functionDetails.operations, true) || apiObj.type;
									//log.debug('found module: ', apiObj)
									return apiObj;
								}

							}

							obj.isNetSuiteAPI = isNetSuiteAPI;
							return obj;
						}

					}
				} else if (main.type = NAMES.MEMBER_EXPRESSION && main.object) {

					if (main.object.hasOwnProperty("object")) {
						var expObj = main.object.object;

						//if multiple properties, then loop
						if (expObj.hasOwnProperty("object")) {
							obj.isNetSuiteAPI = isNetSuiteAPI;
							//log.debug('obj', obj);
							return obj;
						}

					}
				} else if (main.type = NAMES.VARIABLE_DECLARATOR) {

					//if multiple properties, then loop
					obj.isNetSuiteAPI = isNetSuiteAPI;
					//log.debug('VARIABLE_DECLARATION', obj);
					return obj;

				}
			}
			//variable declaration ex. var test;
			else if (obj.type && obj.type == NAMES.VARIABLE_DECLARATOR) {
				obj.isNetSuiteAPI = isNetSuiteAPI;
				//log.debug('VARIABLE_DECLARATION', obj);
				return obj;
			}

			//log.debug('not a NetSuite module?: ', obj);
			obj.assign = assign;
			obj.isNetSuiteAPI = isNetSuiteAPI;
			return obj;
		}

		/**
		 * Extract parameters from a call expression
		 */
		function extFuncParam(args, method) {
			if (!args) return;
			var arguments = args;
			var apiObj = {};
			//1.0 parameters
			if (method.indexOf('nlapi') > -1 && (method == 'nlapiLoadRecord' || method == 'nlapiSubmitField' || method == 'nlapiLookupField' ||
				method == 'nlapiSubmitRecord')) {
				if (arguments.length > 0) {
					if (arguments[0] && arguments[0].type == NAMES.LITERAL) {
						//log.debug('arguments[0]', arguments[0]);
						apiObj.paramType = NAMES.LITERAL;
						apiObj.recordType = arguments[0].value;
					} else if (arguments[0] && arguments[0].type == NAMES.IDENTIFIER) {
						//log.debug('arguments[0]', arguments[0]);
						apiObj.paramType = NAMES.IDENTIFIER;
						apiObj.recordType = arguments[0].name;
					}
				}
			} else {
				for (var k = 0; k < arguments.length; k++) {
					//can assume it's a JSON parameter
					var argument = arguments[k];
					if (argument.type && argument.type == NAMES.OBJECT_EXPRESSION) {
						if (arguments[k].properties) {
							for (var m = 0; m < argument.properties.length; m++) {
								parameter = argument.properties[m];
								if (parameter.key && parameter.value) {
									if ((
										parameter.key.name == 'type' ||
										parameter.key.name == 'Type') &&
										parameter.value) {
										//MEMBER EXPRESSION
										if (
											parameter.value.type &&
											parameter.value.type == NAMES.MEMBER_EXPRESSION) {
											var prop = parameter.value.property;
											//log.debug('prop', prop)
											if (prop) {
												//log.debug('prop' + prop);
												apiObj.paramType = NAMES.MEMBER_EXPRESSION
												apiObj.recordType = prop.name;
												break;
											}
										}
										//IDENTIFIER
										else if (
											parameter.value.type &&
											parameter.value.type == NAMES.IDENTIFIER) {
											apiObj.recordType = parameter.value.name;
											apiObj.paramType = NAMES.IDENTIFIER;
											break;
										}
										//LITERAL
										else {
											apiObj.paramType = NAMES.LITERAL;
											apiObj.recordType = parameter.value.value;
											break;
										}

									}

								}
							}
						}
					}
				}
			}

			//log.debug('apiObj', apiObj);
			return apiObj;
		}

		function extRecType(obj, functionDetails, enableLog) {

			var recType;

			if (obj) {
				for (x in functionDetails) {
					if (enableLog) {
						//log.debug('obj', obj);
						//log.debug('functionDetails[x]', functionDetails[x]);
					}
					if (functionDetails[x] && functionDetails[x].id && obj.type == functionDetails[x].id.name) {
						recType = functionDetails[x].init ? functionDetails[x].init.value : '';
						break;

					}
				}
			} else if (obj) {
				recType = obj.type;

			}
			if (recType) {
				recType = mappings.getRecordText(recType); //get the readable text
				//log.debug('converted recType', recType);
				return recType;
			}

			return null;

		}

		function extRecTypev2(obj, functionDetails, enableLog, save) {

			var recType;

			if (obj) {
				recType = obj.recordType;

			}
			if (recType) {
				recType = mappings.getRecordText(recType); //get the readable text
				//log.debug('converted recType', recType);
				return recType;
			}

			return null;
		}

		function extModule(mod, modList) {
			//log.debug('mod', mod);
			//log.debug('modList', modList);
			if (!modList || modList.length < 1)
				return;

			for (var y in modList) {
				if (mod &&
					mod.module == modList[y].name)
					return modList[y].value;
			}
		}

		/**
		 * #4 function called
		 * Extract all operations from the functions
		 * main = script contents
		 * func = function to check
		 * parsedObj = array of NS operations
		 */
		function extractFunctions(main, func, parsedObj, index, isEntry) { //pass script

			const title = 'extractFunctions';

			var assignedToVariable = false //if assigned to variable, then set assigned value

			//for example: var test = lib.getValue()

			if (!func && !main)
				return;

			var operationFound = false;

			//looping through each function of the script file
			//this is because the entry function of the script is important
			//we start with the entry function and follow the path/flow of the logic

			//START getting the 2.0 return function name
			if (main.apiversion == '2.0') {
				var entryFunctions = main.entryFunctions;
				if (!entryFunctions) return;
				for (var p = 0; p < entryFunctions.length; p++) {
					//for example: aftersubmit, etc.
					if (isEntry) {
						if (entryFunctions[p].key && func["name"] == entryFunctions[p].key.name) {
							func["name"] = entryFunctions[p].value.name;
							//log.debug('setting entry function name', entryFunctions[p].value.name);
						}
					} else {

						var arr = returnObjectAsArray(func);
						var initObj;
						if (arr.length > 0) {
							initObj = arr[0];
						}

					}

				}
			}

			log.debug('func', func);

			var funcInfo = func.right ? func.right : '';

			funcInfo = func.init ? func.init : funcInfo;

			var assign = func.left ? func.left : func.name;

			assign = func.id ? func.id : assign;

			if (funcInfo) {
				func["name"] = funcInfo.callee ? funcInfo.callee.name : funcInfo;
			}

			//log.debug('main.functionList', main.functionList);
			//log.debug('main.functionList.length', main.functionList.length);
			for (var y = 0; y < main.functionList.length; y++) {

				var functionDetails = main.functionList[y];

				//log.debug('func["name"]', func["name"]);
				//log.debug('func["object"]', func["object"]);
				//log.debug('func["property"]', func["property"]);
				//log.debug('functionDetails["functionName"]', functionDetails["functionName"]);
				//log.debug('functionDetails["property"]', functionDetails["property"]);

				//loop until the function to extract is found
				if (func["name"] && functionDetails["functionName"].toString() != func["name"].toString()) //2.0
					continue;

				else if (!func["name"] && functionDetails["functionName"].toString() != func && !functionDetails["property"]) //1.0
					continue;

				else if (func["object"] && functionDetails["property"] && functionDetails["functionName"].toString() != func["object"].toString() &&
					func["property"].toString() != functionDetails["property"].toString())
					continue;

				//4-5-2019
				else if (!func["name"] && functionDetails["functionName"].toString() != func) //1.0
					continue;

				operationFound = true;

				//if(	funcInfo && functionDetails &&
				if (functionDetails &&
					functionDetails.returnValues.length > 0) {
					//assign return value here
					func.returnValue = functionDetails.returnValues[0];
					if (func.returnValue &&
						func.returnValue.assign &&
						func.returnValue.assign.name) {
						func.returnValue.assign.name = assign.name ? assign.name : assign;
						//log.debug('assign!!', assign);
					}

				}
				//END fining function

				//function name:
				//log.debug('function name:', functionDetails.functionName);

				//START loop through operations in the function
				var operations = functionDetails.operations;

				var moduleCall = '';

				//log.debug('list of operations', operations);

				//		log.debug('operations', operations);
				//	log.debug('operations.length', operations.length);
				if (operations.length > 0) {
					var lineloc = functionDetails.linecount;
					parsedObj.functions.push({
						'filename': main.name,
						'fname': functionDetails.functionName,
						'initiator': func.initiator,
						'index': index,
						'linecount': lineloc,
						loop: func.loop
					});
					for (var x = 0; x < operations.length; x++) {

						var operation = operations[x];
						//log.debug('operation!!', operation);

						if (!operation) {
							//log.debug(title + ', no operation: ', operations);
							continue;
						}

						//Check if NetSuite API
						if (operation.isNetSuiteAPI == true) {

							parsedObj.functions.push({
								'operation': operation,
								index: index
							});
						} else {
							//log.debug('Non-NetSuite API Call', operation);
							//loop through the dependencies to find the library file, if it is a library function

							var assignedCallFunction = operation.init ? operation.init : operation.right;

							if (assignedCallFunction &&
								assignedCallFunction.type == NAMES.CALL_EXPRESSION &&
								assignedCallFunction.callee) {

								moduleCall = assignedCallFunction.callee

							} else if (operation.type == NAMES.CALL_EXPRESSION &&
								operation.callee) {

								moduleCall = operation.callee;

							} else {
								moduleCall = operation;
							}

							//log.debug('moduleCall', moduleCall);
							//recursion here to find the first object
							var arr = returnObjectAsArray(moduleCall);
							//log.debug('recursion', arr);
							var initObj;
							if (arr.length > 1)
								initObj = arr[0];
							else
								initObj = moduleCall;

							var isModule = false;

							if (main.parsedParameters) {
								main.parsedParameters.filter(function (n) {

									if (initObj &&
										initObj.object &&
										n.name == initObj.object.name &&
										n.native == false) {

										for (var k = 0; k < main.dependencies.length; k++) {
											if (!main.dependencies[k]) return;
											var library = main.dependencies[k];
											//extractFunctions(main, operation, parsedObj, index+1);
											isModule = true;
											////log.debug('Going into library file', operation.left.name);
											if (operation.left &&
												operation.left.name &&
												initObj.property) {
												initObj.property.left = operation.left.name;
											}
											extractFunctions(library, initObj.property, parsedObj, index + 1);
										}

									}
								});
							}


							//TODO 1.0
							if (!isModule) {
								//if it reaches here, call is not a library function or a NetSuite module, check global variables, and functions

								if (moduleCall &&
									moduleCall.property &&
									moduleCall.property.name == 'save') {

									//log.debug('checking if save');

									var result = chkRecSave({
										current: moduleCall,
										operations: functionDetails
									});

									//log.debug('no result');

									if (result) {

										moduleCall.isNetSuiteAPI = true;
										moduleCall.type = result.type;
										moduleCall.nsmod = result.nsmod;
										parsedObj.functions.push({
											'operation': moduleCall,
											index: index
										});
									}

								} else {

									//loop through the functions list to see if it is inside the function
									for (var u = 0; u < main.functionList.length; u++) {
										var currentFunction = main.functionList[u];
										if (currentFunction &&
											moduleCall &&
											currentFunction.functionName == moduleCall.name) {
											//log.debug('not a lib function or a Netsuite call', moduleCall);
											extractFunctions(main, moduleCall, parsedObj, index + 1);
											continue;
										}
									}

								} //
							}

						}

					}
				}

			} //end functionList for loop
		}

		//returns the nested object as an array
		//for example:
		function returnObjectAsArray(obj) {

			//log.debug('returnObjectAsArray', obj);
			var arr = new Array();
			getNestedObject(obj, arr);
			//log.debug('arr', arr);

			return arr;
		}

		function convertObjectToParsedValue(obj) {

			//returned object
			var parsedObj = {};
			parsedObj.identifier;
			parsedObj.method;
			parsedObj.module;
			parsedObj.assign;
			parsedObj.type;
			parsedObj.nsmod;
			parsedObj.staticValue;
			parsedObj.settingGlobalVar;

			//for variable declaration
			if (!obj || !obj.type) return;

			//Types of expressions
			//1. Call Expression example: nlapiLoadRecord
			//2. Member Expression example:
			if (obj.type == NAMES.VARIABLE_DECLARATOR) {

				if (obj.init &&
					obj.init.type == NAMES.CALL_EXPRESSION) {

					extractFromCallExpression(obj.init, parsedObj);

				}

				if (obj.id &&
					obj.id.name) {

					parsedObj.assign = obj.id.name;

				}

			} else if (obj.type == NAMES.ASSIGNMENT_EXPRESSION) {

				if (obj.operator == '=') {

					if (object.left &&
						object.left.name) {

						parsedObj.assign = object.left.name;

					}
					if (object.right &&
						object.right.type == NAMES.CALL_EXPRESSION) {

						extractFromCallExpression(obj, object.right);

					}
				}

			} else if (obj.type == NAMES.CALL_EXPRESSION) {

				extractFromCallExpression(obj, parsedObj);

			}

			//Re-usable function within extractMethodFromObj function to extract expressions
			function extractFromCallExpression(obj, parsedObj) {

				if (!obj || !parsedObj) return;

				var callee = obj.callee;

				if (!callee) return;

				if (callee.type == NAMES.MEMBER_EXPRESSION) {

					var arr = new Array()

					//need to iterate through each property and object of a member_expression
					//for example library.obj.functionCall();
					getNestedObject(callee, arr);

					if (arr.length == 0 &&
						callee.name) {
						parsedObj.identifier = callee.name
					} else if (arr.length == 1 &&
						arr[0] &&
						arr[0].object &&
						arr[0].object.name &&
						arr[0].property &&
						arr[0].property.name) {

						parsedObj.identifier = arr[0].object.name;
						parsedObj.method = arr[0].property.name;

					} else if (arr[0] &&
						arr[0].object &&
						arr[0].object.name) {

						parsedObj.identifier = arr[0].object.name;

					}

				} else if (callee.type == NAMES.IDENTIFIER) {
					//for 1.0
					if (callee.name &&
						callee.name.indexOf('nlapi') > -1) {

						parsedObj.identifier = callee.name;

					}
					//for function called within same script if 1.0, in a library file
					else {

						parsedObj.identifier = callee.name;

					}
				}

			}

			return parsedObj;
		}

		function getNestedObject(obj, arr) {

			if (obj.hasOwnProperty("object")) {

				getNestedObject(obj.object, arr);
				arr.push({
					object: obj.object,
					property: obj.property
				});

			}

		}

		/**
		 * #5 function called
		 * Convert the parsed object into an HTML string to display in a custom record
		 * For Waterfall textfield on child
		 */
		function convertToHTML(parsedObj) {
			const title = 'convertToHTML';
			var html = '';
			// main functions
			var arr = parsedObj.functions;
			var padding = 0;
			var currentFile;
			var currentFunction;
			//check how many parent functions the function has
			var index = -1;
			for (var i = 0; i < arr.length; i++) {
				var val = arr[i];
				//log.debug('convertToHTML', val)
				if (val) {
					var file, fname, module, op, method, type, initiator, initFile,
						initFname, trail, linecount, linenum, assign, spacing, num, nsmod,
						linebreak;
					linebreak = false;
					file = val.filename + '.js';
					fname = val.fname;
					op = val.operation;
					index = val.index;
					linecount = val.linecount;
					num = (i + 1);
					if (op && op.method && op.isNetSuiteAPI == true) {
						//log.debug('convertToHTML', op.method);
						module = op.operation;
						method = op.method;
						nsmod = op.nsmod;
						type = op.type;
						linenum = op.lineStart;

						if (method.indexOf('nlapi') > -1 && (method == 'nlapiLoadRecord' || method == 'nlapiSubmitField' || method == 'nlapiLookupField' ||
							method == 'nlapiRequestURL' || method == 'nlapiSubmitRecord')) {
							html += "<font size = '3'>" + num + ".";
							for (var e = 0; e < (5 - num.toString().length); e++) {
								html += "&nbsp;&nbsp;";
							}
							for (var k = 0; k < index; k++) {
								html += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
							}
							if (type)
								html += 'Method: ' + method + ', Record Type: ' + type;
							else
								html += 'Method: ' + method;
							linebreak = true;
						} else if (method.indexOf('nlapi') < 0) {
							html += "<font size = '3'>" + num + ".";
							for (var e = 0; e < (5 - num.toString().length); e++) {
								html += "&nbsp;&nbsp;";
							}
							for (var k = 0; k < index; k++) {
								html += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
							}
							if (type)
								html += 'Module: ' + nsmod + ', Method: ' + method + ', Record Type: ' + type;
							else
								html += 'Module: ' + nsmod + ', Method: ' + method;
							linebreak = true;
						}

						if (!linebreak) continue;

						if (op.loop) {
							html += ', <font style = "color: red">inside loop</font>';
						}
						if (op.condition && op.condition == 'if') {
							html += ', <font style = "color: blue">if statment</font>';
						} else if (op.condition && op.condition == 'elseif') {
							html += ', <font style = "color: blue">else if statment</font>';
						} else if (op.condition && op.condition == 'switch') {
							html += ', <font style = "color: blue">switch case</font>';
						}
						if (val.assign) {
							//log.debug('assign', val.assign);
						}
						if (linenum) {
							html += ', Line #' + linenum.line;
						}
						html += "<br>";
					} else {
						html += "<font size = '3'>" + num + ".";
						for (var e = 0; e < (5 - num.toString().length); e++) {
							html += "&nbsp;&nbsp;";
						}
						initiator = val.initiator;
						if (initiator) {
							initFile = initiator.parentFile + '.js';
							initFname = initiator.parentFunction;
						}

						for (var k = 0; k < index; k++) {
							html += "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;";
						}

						html += "<font style = 'font-weight: bold'>File Name: </font>" + file + ",<font style = 'font-weight: bold'> Function Name: </font> " + fname + ",<font style = 'color: green'> Line Count: " + linecount + "</font>";

						if (val.loop) {
							html += ", <font style = 'color: red'>Function is called within a for-loop</font>";
						}
						html += "<br>";
					}
					html += "</font>";
				}
			}
			return html;
		}

		/**
		 * Child level summary
		 */
		function getSummary(parsedObj) {
			// main functions
			var arr = parsedObj.functions;
			var opList = new Array();
			var summary = "";
			//log.debug('parsedObj', parsedObj)
			//get recommendations
			var recommendation = '';
			var recCount = 1;
			var UE = false;
			var apiCount = 0;

			for (var i = 0; i < arr.length; i++) {
				var val = arr[i];
				////log.debug('val', val);
				if (val) {
					//log.debug('val', val);
					var file, fname, module, op, method, type, initiator,
						initFile, initFname, trail, nsmod, loop, saveFound,
						line, property;

					file = val.filename + '.js';
					fname = val.fname;
					op = val.operation;
					index = val.index;

					if (op) {
						if (op.property &&
							op.property.name == 'save') {
							op.method = op.property.name;
						}
					}
					if (op && op.method && op.isNetSuiteAPI == true) {

						//module = op.operation;
						module = op.module;
						nsmod = op.nsmod;
						method = op.method;
						//FE: 4/15/20 - Issues 6 & 7 - Mark operation as loop if it´s directly inside the loop or
						// one of it's parents is inside the loop
						loop = op.loop || isOperationInLoop(op, arr); //if the operation is within a loop
						saveFound = op.saveFound //if there a save for the load/create equivalent
						line = op.lineStart;
						type = op.type;

						//check if UE
						if (fname && (fname.indexOf('beforeSubmit') > -1 || fname.indexOf('afterSubmit') > -1))
							UE = true;

						if(method.indexOf('nlapi') > -1 && requiresMethodRecommendation('', method)){
							if (opList.length == 0)
								opList.push({
									method: method,
									loop: loop,
									saveFound: saveFound,
									line: line,
									arr: [{
										type: type,
										count: 1
									}]
								});
							else {
								var exists = false;
								for (var o = 0; o < opList.length; o++) {
									if (nsmod == opList[o].module && method == opList[o].method) {
										var count = countRecTypes({
											arr: opList[o].arr,
											type: type
										});
										//log.debug('count', count);
										exists = true;
									}
								}
								if (!exists) {
									opList.push({
										method: method,
										loop: loop,
										saveFound: saveFound,
										line: line,
										arr: [{
											type: type,
											count: 1
										}]
									});
								}
							}
						} else {
							if (opList.length == 0)
								opList.push({
									module: nsmod,
									method: method,
									loop: loop,
									saveFound: saveFound,
									line: line,
									arr: [{
										type: type,
										count: 1
									}]
								});
							else {
								var exists = false;
								for (var o = 0; o < opList.length; o++) {
									if (nsmod == opList[o].module && method == opList[o].method) {
										var count = countRecTypes({
											arr: opList[o].arr,
											type: type
										});
										//log.debug('count', count);
										exists = true;
									}
								}
								if (!exists) {
									opList.push({
										module: nsmod,
										method: method,
										loop: loop,
										saveFound: saveFound,
										line: line,
										arr: [{
											type: type,
											count: 1
										}]
									});
								}
							}
						}

						//do recommendations here?
						//recommendation TODO
						//1. Before Submit vs. After Submit
						//2. Number of operations -> move to scheduled process
						//3. Get the line numbers
						//4. internal suitelet / restlet calls

						//get recommendations
						if(	loop && requiresMethodRecommendation(module, method)){
							if(line)
								recommendation += recCount + '. (Line: ' + line.line + ') - ';
							else
								recommendation += recCount;
							recommendation += ' The ' + module + ' ' + method + ' operation is within a for-loop. If there are many iterations,'+
								' the governance limit may be reached and/or may affect performance. \n\n';
							recCount++;
						}
						//log.debug('!module: ' + module + 'method: ' + method);
						if (
							(module == 'record' &&
								saveFound &&
								method == 'load') ||
							(module == '' &&
								saveFound &&
								method == 'nlapiLoadRecord'
							)
						) {
							if (line)
								recommendation += recCount + '. (Line: ' + line.line + ') - ';
							else
								recommendation += recCount;
							recommendation += ' There is a record that is loaded and saved in the script. ' +
								'If possible, consider using a submit API, if not interacting with line items. \n\n';
							recCount++;

							/*if(fname.indexOf('afterSubmit') > -1 ){
                                if(line)
                                    recommendation += recCount + '. (Line: ' + line.line + ') - ';
                                else
                                    recommendation += recCount;

                                recommendation += ' There is a record that is loaded and saved in the script in the after submit event. '+
                                    'If possible, consider moving to the before submit event. \n\n'
                                recCount++;
                            }*/

						} else if (
							(module == 'record' &&
								!saveFound &&
								method == 'load') ||
							(module == '' &&
								!saveFound &&
								method == 'nlapiLoadRecord'
							)
						) {
							if (line)
								recommendation += recCount + '. (Line: ' + line.line + ') - ';
							else
								recommendation += recCount;
							recommendation += ' There is a record that is loaded but not saved in the script. ' +
								'If possible, consider using a lookup API, if not retrieving with line items. \n\n';
							recCount++;

							/*if(fname.indexOf('afterSubmit') > -1 ){
                                if(line)
                                    recommendation += recCount + '. (Line: ' + line.line + ') - ';
                                else
                                    recommendation += recCount;

                                recommendation += ' There is a record that is loaded but not saved in the script in the after submit event. ' +
                                'If possible, consider moving to the before submit event \n\n';
                                recCount++;
                            }*/
						}
						//check beforesubmit, beforeload
					}

				}

			}

			//calculate governance
			var usage = '';
			var totalUsage = 0;

			//calculate grading
			var initGrade = 100;
			var subtotal = 0;
			for (var j = 0; j < opList.length; j++) {

				var module = opList[j].module;
				var method = opList[j].method;
				var isLoop = opList[j].loop;
				var saveFound = opList[j].saveFound;
				var typeArr = opList[j].arr;
				var line = opList[j].line;

				if (!module) module = '';

				//usage
				//log.debug('module', module);
				//log.debug('method', method);
				//log.debug('typeArr', typeArr);

				//weighting
				if (mappings.opWeight[module] && mappings.opWeight[module][method]) {
					subtotal += mappings.opWeight[module][method];
					for (var u in typeArr) {

						//get usage per record type
						var recordCategory = mappings.getRecordCategory(typeArr[u].type);
						//log.debug('recordCategory', recordCategory);

						if (mappings.usage[module] &&
							mappings.usage[module][method] &&
							mappings.usage[module][method][recordCategory]) {

							var govUsage = mappings.usage[module][method][recordCategory];
							//log.debug('found record category');

							if (typeArr[u] && typeArr[u].type) {
								usage += 'Uses ' + govUsage + ' units for ' +
									module + ' ' + method + ' on a ' + typeArr[u].type + ' record \n';
							} else {
								usage += 'Uses ' + govUsage + ' units for ' +
									module + ' ' + method;
							}

							totalUsage += parseInt(govUsage);
						}

						if (mappings.recWeight[typeArr[u].type]) {
							if (typeArr[u].count > 1)
								subtotal += (mappings.recWeight[typeArr[u].type] * typeArr[u].count * 3); //worth more weight if count > 1, might mean dupe saves
							else
								subtotal += (mappings.recWeight[typeArr[u].type] * typeArr[u].count);
						} else {
							subtotal += (1 * typeArr[u].count); //any type not in library file only has a weight of 1
						}
					}



					//log.debug('subtotal', subtotal );
				}

				//count
				//log.debug('opList[j].arr', opList[j].arr)
				var result = printTotalCount({
					arr: opList[j].arr
				});
				if (method.indexOf('nlapi') > -1 && (method == 'nlapiLoadRecord' || method == 'nlapiSubmitField' || method == 'nlapiLookupField' ||
					method == 'nlapiRequestURL' || method == 'nlapiSubmitRecord')) {
					if (result.htmlStr &&
						(
							result.htmlStr.indexOf('null') > -1 ||
							result.htmlStr.indexOf('undefine') > -1
						)
					)
						summary += '' + result.totalCount + ' ' + opList[j].method + '(s)\n';
					else
						summary += '' + result.totalCount + ' ' + opList[j].method + '(s) ' +
							' on ' + result.htmlStr;

					apiCount += parseInt(result.totalCount);
				} else if (method.indexOf('nlapi') < 0) {

					if (result.htmlStr &&
						(
							result.htmlStr.indexOf('null') > -1 ||
							result.htmlStr.indexOf('undefine') > -1
						)
					)
						summary += '' + result.totalCount + ' ' + opList[j].module + ' ' + opList[j].method + '(s)\n';
					//TODO temp workaround for null types/records
					else
						summary += '' + result.totalCount + ' ' + opList[j].module + ' ' + opList[j].method + '(s) ' +
							' on ' + result.htmlStr;

					apiCount += parseInt(result.totalCount);
				}
			}

			totalUsage = totalUsage.toFixed(0);
			apiCount = apiCount.toFixed(0);


			//clean up
			initGrade -= subtotal;
			if (initGrade < 0) initGrade = 10; //grade can't be less than 0

			if (totalUsage > 40) //hard-code 50 usage unites
			{
				recommendation += recCount + '. ';
				recommendation += 'There are a considerate amount of operations in the script which can affect performance. If possible, consider ' +
					'moving the logic to a scheduled process.';
				recCount++
			}

			if (!recommendation || recommendation == '') {
				recCount = 0;
				recommendation += 'No recommendations for this script';
			}

			if (recCount > 1) recCount--;
			recCount = recCount.toFixed(0);

			return {
				summary: summary,
				initGrade: initGrade,
				opList: opList,
				usage: usage,
				totalUsage: totalUsage, //total usage
				recommendation: recommendation,
				apiCount: apiCount, //number of APIs
				recCount: recCount //number of recommendations
			};
        }
        
        /**
         * Verifies if the method requires a performance recommendation
         * @param {string} module 
         * @param {string} method 
         */
        function requiresMethodRecommendation(module, method)
        {
        	//FE: 4/17/20 - Issue 12: return true only for methods that consume units
        	var validModule = module && module.indexOf('N/') == -1? 'N/' + module: module;
			return mappings.usage[validModule] &&
				mappings.usage[validModule][method];
        }

		/**
		*  FE: 4/15/20 - Issues 6 & 7
		* This function checks if one of the parents has loop = true
		* */
		function isOperationInLoop(op, arr) {
			if (op.loop) {
				return true;
			}
			else {
				var parent = op.parent;
				if (parent) {
					for (var i = 0; i < arr.length; i++) {
						if (arr[i].fname == parent) {
							return isOperationInLoop(arr[i], arr);
						}
					}
				}
				return false;
			}
		}

		/**
		 * Parent level summary
		 */
		function listToHTML(opList) {
			var summary = '';
			for (var j = 0; j < opList.length; j++) {
				var module = opList[j].module;
				var method = opList[j].method;
				var typeArr = opList[j].arr;
				var result = printTotalCount({
					arr: typeArr
				});
				if (method.indexOf('nlapi') > -1 && (method == 'nlapiLoadRecord' || method == 'nlapiSubmitField' || method == 'nlapiLookupField' ||
					method == 'nlapiSubmitRecord')) {
					summary += '' + result.totalCount + ' ' + opList[j].method +
						' on ' + result.htmlStr;
				} else if (method.indexOf('nlapi') > -1 && method == 'nlapiRequestURL') {
					summary += '' + result.totalCount + ' ' + opList[j].method + '\n';
				} else if (method.indexOf('nlapi') < 0) {
					summary += '' + result.totalCount + ' ' + opList[j].module + ' ' + opList[j].method;
					if (module == 'N/record' || module == 'N/search')
						summary += ' on ' + result.htmlStr;
					else
						summary += '\n';
				}

			}
			//log.debug('listToHTML', summary);
			return summary;
		}

		function countRecTypes(obj) {
			var type = obj.type;
			var arr = obj.arr;
			var found = false;
			for (var i = 0; i < arr.length; i++) {
				var p = arr[i];
				if (p.type == type) {
					found = true;
					if (!p["count"])
						p["count"] = 1;
					else
						p["count"]++;
				}
			}
			if (!found && arr)
				arr.push({
					type: type,
					count: 1
				});
		}

		function printTotalCount(obj) {
			//log.debug('obj total count', obj);
			var arr = obj.arr;
			var length = arr.length;
			var htmlStr = '';
			var totalCount = 0;
			if (length == 0)
				return '';
			else {
				for (var p = 0; p < arr.length; p++) {
					if (p > 0)
						htmlStr += ", ";
					htmlStr += arr[p].count + " " + arr[p].type + "(s)";
					totalCount += arr[p].count;
					//log.debug('htmlStr', htmlStr);
				}
			}
			htmlStr += '\n';
			return {
				htmlStr: htmlStr,
				totalCount: totalCount
			};
		}

		/**
		 *  _getScriptSource
		 */
		function _getScriptSource(params) {
			var LOG_TITLE = PREFIX + '_getScriptSource',
				entryFunctions = [],
				fileId,
				fileObj,
				libFiles = [],
				lines,
				scriptRec,
				scriptSource,
				i;

			scriptRec = record.load({
				id: params.id,
				type: 'script'
			});

			fileObj = file.load({
				id: scriptRec.getValue({
					fieldId: 'scriptfile'
				})
			});

			scriptSource = {
				file: {
					id: fileObj.id,
					name: fileObj.name.slice(0, -3),
					content: fileObj.getContents(),
					folder: fileObj.folder
				}
			};

			return scriptSource;
		}

		function _summarize(summary) {
			var LOG_TITLE;

			LOG_TITLE = PREFIX + 'summarize';
			var masterId;
			var keyId;
			var arr1 = new Array();
			var grade = new Array();
			var mainFileCount = 0;
			var libFileCount = 0;
			var totalRecommendationCount = 0;
			var totalUsageCount = 0;
			var totalAPICount = 0;

			var govArr1 = new Array();
			var govArr2 = new Array();

			var apiArr1 = new Array();
			var apiArr2 = new Array();

			var totalUsage = "";
			var totalAPI = "";

			var errors = "";

			summary.reduceSummary.errors.iterator().each(function (k, v) {
				log.error(LOG_TITLE, 'Error=' + k + '; ' + v);
				errors += "Error parsing out script: ";
				errors += k + '; ' + v + "\n";
			});

			summary.output.iterator().each(function (key, value) {
				if (value) {

					//4-9-2019 checking for errors here;
					if (value.indexOf('Error:') > -1) {
						errors += value;
						log.error('error occured value', value);
						log.error('error occured key', key);
					} else {
						var value = JSON.parse(value);
						if (value["initGrade"])
							grade.push(value["initGrade"]);

						//operations list
						var arr2 = value["opList"];
						if (arr1.length == 0) {
							arr1 = arr2;
						} else {
							getMasterSummary({
								arr1: arr1,
								arr2: arr2
							});
						}
						//end operations list

						//log.debug('arr2', arr2);
						if (value["lineCount"]) {
							//lineCount.push(value["lineCount"]);
							if (value["lineCount"]) {
								var val = value["lineCount"];
								//log.debug('val', val);
								if (val.main)
									mainFileCount += parseInt(val.main);
								if (val.lib)
									libFileCount += parseInt(val.lib);

							}

						}

						if (value.apiCount)
							totalAPICount += parseInt(value.apiCount);
						if (value.totalUsage)
							totalUsageCount += parseInt(value.totalUsage);
						if (value.recCount)
							totalRecommendationCount += parseInt(value.recCount);
						if (value.usage)
							totalUsage += value.usage;
						if (value.recommendation)
							totalAPI += value.recommendation + "\n";
					}
				}
				if (key)
					keyId = key;

				return true;
			});
			try {
				if (keyId) {

					var masterId = search.lookupFields({
						type: 'customrecord_parse_details',
						id: keyId,
						columns: 'custrecord_parent_master_summary'
					});
					//log.audit('masterId', masterId);
					if (masterId && masterId["custrecord_parent_master_summary"]) {
						var id = masterId["custrecord_parent_master_summary"][0].value;
						////log.debug('last arr1', arr1);
						var summary = listToHTML(arr1);
						var rec = record.load({
							type: 'customrecord_main_parse_summary',
							id: id
						});
						//log.debug('master summary',  summary);
						rec.setValue({
							fieldId: 'custrecord_parse_ave_script_grade',
							value: getAveGrade(grade)
						});
						rec.setValue({
							fieldId: 'custrecord_parsing_summary',
							value: summary
						});
						//custrecord_parse_sum_line_count
						var lineText = 'Total main script line count: ' + mainFileCount + ' \n';
						lineText += 'Total lib line count: ' + libFileCount
						totalAPICount = totalAPICount.toFixed(0);
						totalUsageCount = totalUsageCount.toFixed(0);
						totalRecommendationCount = totalRecommendationCount.toFixed(0);
						rec.setValue({
							fieldId: 'custrecord_parse_sum_line_count',
							value: lineText
						});
						rec.setValue({
							fieldId: 'custrecord_record_sum_operations_found',
							value: totalAPICount
						});
						rec.setValue({
							fieldId: 'custrecord_record_sum_gov_count',
							value: totalUsageCount
						});
						rec.setValue({
							fieldId: 'custrecord_record_sum_gov_usage',
							value: totalUsage
						});
						rec.setValue({
							fieldId: 'custrecord_record_sum_total_rec_count',
							value: totalRecommendationCount
						});
						rec.setValue({
							fieldId: 'custrecord_record_sum_efficiency',
							value: totalAPI
						});
						rec.save();
					} else {
						var rec = record.load({
							type: 'customrecord_main_parse_summary',
							id: keyId
						});
						rec.setValue({
							fieldId: 'custrecord_parse_errors',
							value: errors
						});
						rec.save();
					}
				}
			} catch (e) {
				log.error('Error in updating parent summary record.', e);
			}

		}

		function getAveGrade(arr) {
			var total = 0;
			for (var i = 0; i < arr.length; i++) {
				var val = arr[i];
				total += val;
			}
			total /= arr.length;
			total = total.toFixed(2);
			return total;
		}

		function getMasterSummary(obj) {
			var arr1, arr2;
			arr1 = obj.arr1;
			arr2 = obj.arr2;
			for (var v = 0; v < arr2.length; v++) {
				var arr2Mod = arr2[v].module;
				var arr2Method = arr2[v].method;
				var arr2Arr = arr2[v].arr;
				var found = false;
				var recFound = false;
				for (var x = 0; x < arr1.length; x++) {
					var arr1Mod = arr1[x].module;
					var arr1Method = arr1[x].method;
					var arr1Arr = arr1[x].arr;
					if (arr1Mod == arr2Mod && arr1Method == arr2Method) {
						for (b in arr2Arr) {
							var type2 = arr2Arr[b].type;
							for (var c in arr1Arr) {
								var type1 = arr1Arr[c].type;
								if (type1 == type2) {
									//console.log('same');
									arr1Arr[c].count += arr2Arr[b].count;
									recFound = true;
								}
							}
							if (!recFound) {
								arr1Arr.push({
									type: type2,
									count: arr2Arr[b].count
								});
							}
						}
						found = true;
					}
				}
				if (!found) {
					arr1.push({
						module: arr2Mod,
						method: arr2Method,
						arr: arr2[v].arr
					});
				}
			}

			//log.debug('success get master summary', JSON.stringify(arr1));
		}

		function getMasterGovernace(obj) {
			var arr1, arr2;
			arr1 = obj.arr1;
			arr2 = obj.arr2;
			for (var v = 0; v < arr2.length; v++) {
				var found = false;
				var recFound = false;

				for (var x = 0; x < arr1.length; x++) {

					found = true;
				}
				if (!found) {
					arr1.push({
						module: arr2Mod,
						method: arr2Method,
						arr: arr2[v].arr
					});
				}
			}
			//log.debug('success get master summary', JSON.stringify(arr1));
		}

		return {
			getInputData: _getInput,
			reduce: _reduce,
			summarize: _summarize
		};
	});
//DG
