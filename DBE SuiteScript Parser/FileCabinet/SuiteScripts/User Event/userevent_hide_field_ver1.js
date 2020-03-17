/**
 * Module Description
 * 
 * Version    Date            Author           Remarks
 * 1.00       09 Mar 2019     dgarcia
 *
 */

/**
 * The recordType (internal id) corresponds to the "Applied To" record in your script deployment. 
 * @appliedtorecord recordType
 *   
 * @param {String} type Operation types: create, edit, view, copy, print, email
 * @param {nlobjForm} form Current form
 * @param {nlobjRequest} request Request object
 * @returns {Void}
 */
function userEventBeforeLoad(type, form, request){
	if(type=='view'){
		nlapiLogExecution('DEBUG', 'view');
	    var myfield = nlapiGetField('existingrecmachcustrecord_parent_master_summary');
	    if(myfield)
	    	myfield.setDisplayType('hidden');
	    
	    var myfield2 = nlapiGetField('searchid');
	    if(myfield2)
	    	myfield2.setDisplayType('hidden');
	    
	    form.removeButton('attach');
	}
}
