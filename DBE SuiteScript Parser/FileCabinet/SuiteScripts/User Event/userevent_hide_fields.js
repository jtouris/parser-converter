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
function hideFields(type, form, request){
	//log.debug('works')
	scriptContext.form.removeButton('edit');
}
