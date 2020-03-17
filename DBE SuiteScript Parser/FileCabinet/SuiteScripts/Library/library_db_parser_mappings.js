/**
 * @NModuleScope Public
 * @NApiVersion 2.x
 * @NModuleScope SameAccount
 */
define([],

	function() {

		// We use the usage values to calculate weight, opWeight isn't currently being used to calculate weight
		const opWeight = {
			'N/record': {
				'create': 3,
				'load': 5,
				'save': 8,
				'submitFields': 3
			},
			'N/search':{
				'lookupFields': 1,
				'create': 3,
				'load': 3
			},
			'N/https':{
				'post': 5,
				'get':3
			},
			'':{
				'nlapiLoadRecord':5,
				'nlapiSubmitField': 3,
				'nlapiLookupField': 1,
				'nlapiSubmitRecord': 8
			}

		};
// used in conjunction with the transaction object
		const usage = {
			'N/record': {
				'create': {
					'transaction': 10,
					'custom': 2,
					'other': 5
				},
				'load': {
					'transaction': 10,
					'custom': 2,
					'other': 5
				},
				'save': {
					'transaction': 20,
					'custom': 4,
					'other': 10
				},
				'submitFields': {
					'transaction': 10,
					'custom': 2,
					'other': 5
				},
			},
			'N/search':{
				'lookupFields': {
					'transaction': 10,
					'custom': 2,
					'other': 5
				},
				'create': 0,
				'load' : {
					'transaction': 10,
					'custom': 2,
					'other': 5
				}
			},
			'N/https':{
				'post': 10,
				'get':10
			},
			'N/https':{
				'post': 10,
				'get':10
			},
			'':{
				'nlapiLoadRecord':{
					'transaction': 10,
					'custom': 2,
					'other': 5
				},
				'nlapiSubmitField':{
					'transaction': 10,
					'custom': 2,
					'other': 5
				},
				'nlapiLookupField':{
					'transaction': 10,
					'custom': 2,
					'other': 5
				},
				'nlapiSubmitRecord':{
					'transaction': 20,
					'custom': 4,
					'other': 10
				},
				'nlapiSubmitRecord':{
					'transaction': 20,
					'custom': 4,
					'other': 10
				},
				'nlapiRequestURL':{
					'': 10,
				},
			}

		};

		// Not currently used to calculate weight, we use the combo of usage and transactions
		const recWeight = {
			'Sales Order' : 3,
			'Invoice' : 3,
			'Vendor': 1,
			'Vendor Bill': 1,
			'Journal': 2,
			'Cash Sale': 3,
			'Cash Refund': 3,
			'Cash Sale' : 3,
			'Check' : 3,
			'Customer Deposit': 2,
			'Credit Memo': 3,
			'Estimate': 3,
			'Deposit': 3,
			'Opportunity': 3
		};

		// mapping of all record types considered transactions
		const transactions = ['Sales Order',
			'Invoice',
			'Opportunity',
			'Customer Deposit',
			'Journal',
			'Cash Sale',
			'Credit Memo',
			'Check',
			'Cash Refund',
			'Estimate',
			'Vendor Bill',
			'Accounting Book',
			'Credit Memo',
			'Customer Deposit',
			'Customer Payment',
			'Vendor Payment',
			'Vendor Credit',
			'Item Fulfillment'];

		const custom = 'Custom Record';

// val is checked against the list of record types to see what record type it is
		function getRecordCategory(val){

			// if val is null or if the transactions array is empty, fail safe to prevent null errors
			if(!val || !transactions) return null;

			// if the val is in the transactions array it will return a number greater than -1
			if(transactions.indexOf(val) > -1){
				return 'transaction';
			}

			if(val == custom){
				return 'custom'
			}

			return 'other';
		}

		// makes record types more human readable to be used on the UI
		function getRecordText(recType){
			if(recType.toLowerCase().indexOf('sales') > -1)
				recType = "Sales Order";
			else if(recType.toLowerCase().indexOf('salesorder') > -1)
				recType = "Sales Order";
			else if(recType.toLowerCase().indexOf('order') == 0)
				recType = "Sales Order";
			else if(recType.toLowerCase().indexOf('invoice') > -1)
				recType = "Invoice";
			else if(recType.toLowerCase().indexOf('bill') > -1)
				recType = "Vendor Bill";
			else if(recType.toLowerCase().indexOf('vendor') > -1)
				recType = "Vendor";
			else if(recType.toLowerCase().indexOf('journal') > -1)
				recType = "Journal";
			else if(recType.toLowerCase().indexOf('accountingbook') > -1)
				recType = "Accounting Book"
			else if(recType.toLowerCase().indexOf('account') > -1)
				recType = "Account";
			else if(recType.toLowerCase().indexOf('activity') > -1)
				recType = "Activity";
			else if(recType.toLowerCase().indexOf('address') > -1)
				recType = "Address";
			else if(recType.toLowerCase().indexOf('advintercompanyjournalentry') > -1)
				recType = "Advanced Intercompany Journal Entry";
			else if(recType.toLowerCase().indexOf('assemblybuild') > -1)
				recType = "Assembly Build";
			else if(recType.toLowerCase().indexOf('bin') > -1)
				recType = "Bin";
			else if(recType.toLowerCase().indexOf('billingschedule') > -1)
				recType = "Billing Scheduled";
			else if(recType.toLowerCase().indexOf('bom') > -1)
				recType = "Bill of Materials";
			else if(recType.toLowerCase().indexOf('assemblyitem') > -1)
				recType = "Build/Assembly Item";
			else if(recType.toLowerCase().indexOf('campaign') > -1)
				recType = "Campaign";
			else if(recType.toLowerCase().indexOf('case') > -1)
				recType = "Case";
			else if(recType.toLowerCase().indexOf('cashrefund') > -1)
				recType = "Cash Refund";
			else if(recType.toLowerCase().indexOf('cashsale') > -1)
				recType = "Cash Sale";
			else if(recType.toLowerCase().indexOf('check') > -1)
				recType = "Check";
			else if(recType.toLowerCase().indexOf('contact') > -1)
				recType = "Contact";
			else if(recType.toLowerCase().indexOf('contactrole') > -1)
				recType = "Contact Role";
			else if(recType.toLowerCase().indexOf('creditmemo') > -1)
				recType = "Credit Memo";
			else if(recType.toLowerCase().indexOf('currency') > -1)
				recType = "Currency";
			else if(recType.toLowerCase().indexOf('customer') > -1)
				recType = "Customer";
			else if(recType.toLowerCase().indexOf('customerdeposit') > -1)
				recType = "Customer Deposit";
			else if(recType.toLowerCase().indexOf('customerpayment') > -1)
				recType = "Customer Payment";
			else if(recType.toLowerCase().indexOf('customerrefund') > -1)
				recType = "Customer Refund";
			else if(recType.toLowerCase().indexOf('deposit') > -1)
				recType = "Deposit";
			else if(recType.toLowerCase().indexOf('employee') > -1)
				recType = "Employee";
			else if(recType.toLowerCase().indexOf('entity') > -1)
				recType = "Entity";
			else if(recType.toLowerCase().indexOf('estimate') > -1)
				recType = "Estimate";
			else if(recType.toLowerCase().indexOf('calendarevent') > -1)
				recType = "Event";
			else if(recType.toLowerCase().indexOf('expensecategory') > -1)
				recType = "Expense Category";
			else if(recType.toLowerCase().indexOf('file') > -1)
				recType = "File";
			else if(recType.toLowerCase().indexOf('fulfillmentrequest') > -1)
				recType = "Fulfillment Request";
			else if(recType.toLowerCase().indexOf('intercompanytransferorder') > -1)
				recType = "Intercompany Transfer Order";
			else if(recType.toLowerCase().indexOf('inventoryadjustment') > -1)
				recType = "Inventory Adjustment";
			else if(recType.toLowerCase().indexOf('inventorydetail') > -1)
				recType = "Inventory Detail";
			else if(recType.toLowerCase().indexOf('inventorynumber') > -1)
				recType = "Inventory Number";
			else if(recType.toLowerCase().indexOf('inventoryitem') > -1)
				recType = "Inventory Part";
			else if(recType.toLowerCase().indexOf('inventorytransfer') > -1)
				recType = "Inventory Transfer";
			else if(recType.toLowerCase().indexOf('itemreceipt') > -1)
				recType = "Item Receipt";
			else if(recType.toLowerCase().indexOf('item') > -1)
				recType = "Item";
			else if(recType.toLowerCase().indexOf('location') > -1)
				recType = "Location";
			else if(recType.toLowerCase().indexOf('opportunity') > -1)
				recType = "Opportunity";
			else if(recType.toLowerCase().indexOf('phonecall') > -1)
				recType = "Phone Call";
			else if(recType.toLowerCase().indexOf('pricebook') > -1)
				recType = "Price Book";
			else if(recType.toLowerCase().indexOf('pricing') > -1)
				recType = "Pricing";
			else if(recType.toLowerCase().indexOf('job') > -1)
				recType = "Project";
			else if(recType.toLowerCase().indexOf('purchaseorder') > -1)
				recType = "Purchase Order";
			else if(recType.toLowerCase().indexOf('returnauthorization') > -1)
				recType = "Return Authorization";
			else if(recType.toLowerCase().indexOf('revenuearrangement') > -1)
				recType = "Revenue Arrangement";
			else if(recType.toLowerCase().indexOf('revrecschedule') > -1)
				recType = "Revenue Recognition Schedule";
			else if(recType.toLowerCase().indexOf('role') > -1)
				recType = "Role";
			else if(recType.toLowerCase().indexOf('scheduledscript') > -1)
				recType = "Scheduled Script";
			else if(recType.toLowerCase().indexOf('subsidiary') > -1)
				recType = "Subsidiary";
			else if(recType.toLowerCase().indexOf('task') > -1)
				recType = "Task";
			else if(recType.toLowerCase().indexOf('timebill') > -1)
				recType = "Time";
			else if(recType.toLowerCase().indexOf('timeentry') > -1)
				recType = "Time Entry";
			else if(recType.toLowerCase().indexOf('timesheet') > -1)
				recType = "Timesheet";
			else if(recType.toLowerCase().indexOf('transaction') > -1)
				recType = "Transaction";
			else if(recType.toLowerCase().indexOf('transferorder') > -1)
				recType = "Transfer Order";
			else if(recType.toLowerCase().indexOf('vendorbill') > -1)
				recType = "Vendor Bill";
			else if(recType.toLowerCase().indexOf('vendorcredit') > -1)
				recType = "Vendor Credit";
			else if(recType.toLowerCase().indexOf('vendorpayment') > -1)
				recType = "Vendor Payment";
			else if(recType.toLowerCase().indexOf('vendorreturnauthorization') > -1)
				recType = "Vendor Return Authorization";
			else if(recType.toLowerCase().indexOf('workorder') > -1)
				recType = "Work Order";
			else if(recType.toLowerCase().indexOf('partner') > -1)
				recType = "Partner";
			else if(recType.toLowerCase().indexOf('lead') > -1)
				recType = "Lead";
			return recType;
		}

		return {
			opWeight:opWeight,
			recWeight:recWeight,
			getRecordText:getRecordText,
			getRecordCategory:getRecordCategory,
			usage:usage
		};

	});