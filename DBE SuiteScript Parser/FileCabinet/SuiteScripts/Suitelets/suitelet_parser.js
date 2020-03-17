/**  
* @NApiVersion 2.0  
* @NScriptType suitelet  
*/ 
define(['N/ui/serverWidget', 
        'N/task', 
        'N/file', 
        'N/record',
        'N/search',
        'N/runtime',
        'N/redirect',
        'N/url'], 
function(ui, 
		task, 
		file, 
		record, 
		search,
		runtime,
		redirect,
		url){
	
     function onRequest(context){
    	 var PAGE_SIZE = 20;
    	 var script = runtime.getCurrentScript();
    	 var scriptId = context.request.parameters.script;
         var deploymentId = context.request.parameters.deploy;
    	 if (context.request.method === 'GET') {
    		 var form = ui.createForm({
	             title: 'DBE Script Parser'
	         });
    		 var message = form.addField({
	             id: 'message',
	             type: ui.FieldType.INLINEHTML,
	             label: 'Message',

	         }).updateLayoutType({
                 layoutType: ui.FieldLayoutType.OUTSIDEABOVE  
	         });
	         message.defaultValue = "</br>A tool used to parse out the apis from a script. " + 
	        	 "Works for 1.0 and 2.0 scripts </br></br>";
	         message.updateDisplaySize({
	        	    height : 100,
	        	    width : 25
	        	});
	         
    		 var scenario = form.addField({
                 id: 'parseby',
                 type: ui.FieldType.SELECT,
                 label: 'Parse By Type',
             });
             scenario.addSelectOption({
                 value: 'record',
                 text: 'Record Type'
             });
             scenario.addSelectOption({
                 value: 'internalid',
                 text: 'Script Internal Ids'
             });
             /*scenario.addSelectOption({
                 value: 'bundleid',
                 text: 'Bundle Id'
             });*/
             scenario.updateLayoutType({
	        	    layoutType: ui.FieldLayoutType.OUTSIDE
	         });
             scenario.updateBreakType({
	        	 breakType: ui.FieldLayoutType.STARTROW
	         });
             var recordType = form.addField({
                 id: 'recordtype',
                 type: ui.FieldType.SELECT,
                 label: 'Record Type',
             });
             recordType.addSelectOption({
                 value: 'SALESORDER',
                 text: 'Sales Order'
             });
             recordType.addSelectOption({
                 value: 'INVOICE',
                 text: 'Invoice'
             });
             recordType.updateLayoutType({
	        	    layoutType: ui.FieldLayoutType.OUTSIDE
	         });
             recordType.updateBreakType({
	        	 breakType: ui.FieldLayoutType.STARTROW
	         });
             var internalIds = form.addField({
                 id: 'internalids',
                 type: ui.FieldType.TEXT,
                 label: 'Internal Ids',
             });
             internalIds.updateLayoutType({
	        	    layoutType: ui.FieldLayoutType.OUTSIDE
	         });
             internalIds.updateBreakType({
	        	 breakType: ui.FieldLayoutType.STARTROW
	         });

             
    		 form.addSubmitButton({
	             label: 'Run Parser',
	         });
    		 
             
             //list of parse results
             // Add sublist that will show results
             var sublist = form.addSublist({
                     id : 'custpage_table',
                     type : ui.SublistType.LIST,
                     label : 'Parsed Scripts Master Records'
                 });
             
             // Add columns to be shown on Page
             var test = sublist.addField({
                 id : 'id',
                 label : 'Internal ID',
                 type : ui.FieldType.URL
                 //type: ui.FieldType.INLINEHTML
             });
             
             test.linkText = 'View Master Record Results';
                 
          // Run search and determine page count
             var retrieveSearch = runSearch('customsearch_master_parse_summary_search', PAGE_SIZE);
             var pageCount = parseInt(retrieveSearch.count / PAGE_SIZE);
             var pageId = parseInt(context.request.parameters.page);
             // Set pageId to correct value if out of index
             if (!pageId || pageId == '' || pageId < 0)
                 pageId = 0;
             else if (pageId >= pageCount)
                 pageId = pageCount - 1;

             // Add buttons to simulate Next & Previous
            /* if (pageId != 0) {
                 form.addButton({
                     id : 'custpage_previous',
                     label : 'Previous',
                     functionName : 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId - 1) + ')'
                 });
             }

             if (pageId != pageCount - 1) {
                 form.addButton({
                     id : 'custpage_next',
                     label : 'Next',
                     functionName : 'getSuiteletPage(' + scriptId + ', ' + deploymentId + ', ' + (pageId + 1) + ')'
                 });
             }*/

             /*// Add drop-down and options to navigate to specific page
             var selectOptions = form.addField({
                     id : 'custpage_pageid',
                     label : 'Page Index',
                     type : ui.FieldType.SELECT
                 });

             for (i = 0; i < pageCount; i++) {
                 if (i == pageId) {
                     selectOptions.addSelectOption({
                         value : 'pageid_' + i,
                         text : ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE),
                         isSelected : true
                     });
                 } else {
                     selectOptions.addSelectOption({
                         value : 'pageid_' + i,
                         text : ((i * PAGE_SIZE) + 1) + ' - ' + ((i + 1) * PAGE_SIZE)
                     });
                 }
             }*/

             // Get subset of data to be shown on page
             //var addResults = fetchSearchResult(retrieveSearch, pageId);

             // Set data returned to columns
             var j = 0;
             var account = runtime.accountId; 
        	 var output = url.resolveDomain({
        		    hostType: url.HostType.APPLICATION,
        		    accountId: account
        	 });
        	 var base = 'http://'+output+'/app/common/custom/custrecordentry.nl?rectype=';
        	 //&id=59201&whence=
             retrieveSearch.forEach(function (result) {
            	 //generate url
            	 //get NetSuite url
            	 //load rec
            	 var rec = record.load({type: result.recordType, id: result.id});
            	 var recType = rec.getValue({fieldId: 'rectype'});
            	 base+= recType;
                 sublist.setSublistValue({
                     id : 'id',
                     line : j,
                     value : base + '&id=' + result.id
                 });

                 j++
             });
             
	         context.response.writePage(form);
    	 }
    	 else{
    		 //pass the values to the map reduce script
    		 var pref = {};
    		 pref.custscript_parse_by =  context.request.parameters.parseby;
    		 if(pref.custscript_parse_by == 'record')
    			 pref.custscript_scripts_to_parse =  context.request.parameters.recordtype
    		 else
    			 pref.custscript_scripts_to_parse =	 context.request.parameters.internalids			 
    		 var mrTask = task.create({
				    taskType: task.TaskType.MAP_REDUCE,
				    scriptId: 'customscript_ns_esm_analyzer',
				    deploymentId: 'customdeploy_ns_esm_analyzer',
				});
    		 mrTask.params = pref;
    		 var mrTaskId = mrTask.submit();
    		 var waitTime = 2000; //wait 5 seconds before searching
    		 var taskStatus = task.checkStatus(mrTaskId);
    		 do{
    			 log.error('Please wait, map reduce script is processing..');	
     			 var waitTill = new Date(new Date().getTime() + waitTime);
     			 while(waitTill > new Date()){}
    			 taskStatus = task.checkStatus(mrTaskId);
    		 }
    		 while(taskStatus.status == 'PROCESSING' || taskStatus.status == 'PENDING');
    		 //redirect to same Suitelet
    		 
    		 redirect.toSuitelet({
    			    scriptId: script.id ,
    			    deploymentId: script.deploymentId,
    			    parameters: {'custparam_test':'helloWorld'} 
    			});
 			 context.response.write('taskStatus, ' + taskStatus.status);
    	 }
     }
     
     function runSearch(searchId, searchPageSize) {
         var searchObj = search.load({
                 //id : 'customsearch_parse_details_search'
        	 	id: searchId
             });

       

         /*return searchObj.runPaged({
             pageSize : searchPageSize
         });*/
         
         var results = searchObj.run().getRange({start: 0, end: 10});
         log.error('searchObj', JSON.stringify(results));
         return results
     }

     function fetchSearchResult(pagedData, pageIndex) {

         var searchPage = pagedData.fetch({
                 index : pageIndex
             });

         var results = new Array();
         /*var output = url.resolveDomain({
        	    hostType: url.HostType.APPLICATION,
        	    accountId: '012345'
        	});*/
         searchPage.data.forEach(function (result) {
             var internalId = result.id;

             results.push({
                 "id" : 'http://google.com',
             });
         });

         return results;
     }
      
     return {
             onRequest: onRequest
     }
});    