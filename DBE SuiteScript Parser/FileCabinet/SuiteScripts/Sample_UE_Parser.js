/**
 * @NApiVersion 2.x
 * @NScriptType UserEventScript
 * @NModuleScope SameAccount
 */
define(['N/record', 'N/search', 'N/https'],
/**
 * @param {record} record
 * @param {search} search
 */
function(record, search, https) {
   
    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {string} scriptContext.type - Trigger type
     * @param {Form} scriptContext.form - Current form
     * @Since 2015.2
     */
    function beforeLoad(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function beforeSubmit(scriptContext) {

    }

    /**
     * Function definition to be triggered before record is loaded.
     *
     * @param {Object} scriptContext
     * @param {Record} scriptContext.newRecord - New record
     * @param {Record} scriptContext.oldRecord - Old record
     * @param {string} scriptContext.type - Trigger type
     * @Since 2015.2
     */
    function afterSubmit(scriptContext) {
    	//get customer record
    	var rec = record.load({type: 'customer', id: 7884});
    	rec.setValue({fieldId: 'comments', value: 'After Submit value'});
    	rec.save();
    	
    	//load record
    	var so = record.load({type: record.Type.SALES_ORDER, id: 30289});
    	
    	//do an https call
    	for(var i = 0; i < 5; i++){
    		var response = https.get({
    		    url: 'https://www.testwebsite.com'
    		});
    		
    	}
    	
    	var val = record.submitFields({type: 'invoice', id:30282, values: {
    		memo: 'After Submit value'
    	}});
    	
    	var val = record.submitFields({type: 'journal', id:21462, values: {
    		memo: 'After Submit value'
    	}});
    	
    }

    return {
        beforeLoad: beforeLoad,
        beforeSubmit: beforeSubmit,
        afterSubmit: afterSubmit
    };
    
});
