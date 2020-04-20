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
				'copy': {
					'transaction': 10,
					'custom': 2,
					'other': 5
				},
				'delete': {
					'transaction': 20,
					'custom': 4,
					'other': 10
				},
				'transform': {
					'transaction': 10,
					'custom': 2,
					'other': 5
				},
				'detach': 10
			},
			'N/search':{
				'lookupFields': 1,
				'runPaged': 5,
				'save': 5,
				'delete': 5,
				'load': 5,
				'duplicates': 10,
				'global': 10
			},
			'N/cache':{
				'get': 1, //TODO: if loader is present governance is 2
				'put': 1,
				'remove' : 1
			},
			'N/https':{
				'post': 10,
				'get':10,
				'put':10,
				'delete':10,
				'request':10,
				'renderPdf': 10
			},
			'N/https':{
				'post': 10,
				'get':10,
				'put':10,
				'delete':10,
				'request':10
			},
			'N/config':{
				'load': 10
			},
			'N/email':{
				'send': 20,
				'sendBulk': 10,
				'sendCampaignEvent': 10
			},
			'N/file':{
				'save': 20,
				'delete': 20,
				'load': 10
			},
			'N/redirect':{
				'toSavedSearch': 5,
				'toSavedSearchResult': 5
			},
			'N/render':{
				'bom': 10,
				'packingSlip': 10,
				'pickingTicket': 10,
				'statement': 10,
				'transaction': 10,
				'xmlToPdf': 10
			},
			'N/sso':{
				'generateSuiteSignOnToken': 20
			},
			'N/transaction':{
				'void': 10
			},
			'N/action':{
				'executeBulk': 50
			},
			'N/auth':{
				'changeEmail': 10,
				'changePassword': 10
			},
			'N/certificateControl':{
				'save': 10,
				'createCertificate': 10,
				'deleteCertificate': 10,
				'findCertificates': 10,
				'findUsages': 10,
				'loadCertificate': 10
			},
			'N/crypto/certificate':{
				'createSigner': 10,
				'createVerifier': 10,
				'verifyXmlSignature': 10,
				'signXml': 10,
			},
			'N/currency':{
				'exchangeRate': 10
			},
			'N/format/i18n':{
				'format': 10,
				'getCurrencyFormatter': 10,
				'getNumberFormatter': 10,
			},
			'N/https/clientCertificate':{
				'delete': 10,
				'get': 10,
				'post': 10,
				'put': 10,
				'request': 10,
			},
			'N/keyControl':{
				'createKey': 10,
				'deleteKey': 10,
				'findKeys': 10,
				'loadKey': 10,
			},
			'N/piremoval':{
				'deleteTask': 20,
				'run': 20,
				'save': 20,
				'deleteTask': 20,
			},
			'N/query':{
				'run': 10,
				'run.promise': 10,
				'runPaged': 10,
				'runPaged.promise': 10,
				'delete': 10,
				'load': 10,
				'load.promise': 10,
				'runSuiteQL': 10,
				'runSuiteQLPaged': 10
			},
			'N/task/accounting/recognition':{
				'checkStatus': 50
			},
			'N/workflow':{
				'initiate': 20,
				'trigger': 20
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
				'nlapiCreateRecord':{
					'transaction': 10,
					'custom': 2,
					'other': 5
				},
				'nlapiCopyRecord':{
					'transaction': 10,
					'custom': 2,
					'other': 5
				},
				'nlapiTransformRecord':{
					'transaction': 10,
					'custom': 2,
					'other': 5
				},
				'nlapiDeleteRecord':{
					'transaction': 20,
					'custom': 4,
					'other': 10
				},
				'nlapiRequestURL':{
					'': 10,
				},
				'nlapiSearchRecord':{
					'': 10,
				},
				'nlapiSearchGlobal':{
					'': 10,
				},
				'nlapiScheduleScript':{
					'': 20,
				},
				'nlapiRequestURL':{
					'': 10,
				},
				'nlapiSendEmail':{
					'': 10,
				},
				'nlapiExchangeRate':{
					'': 10,
				},
				'nlapiInitiateWorkflow':{
					'': 20,
				},
				'nlapiTriggerWorkflow':{
					'': 20,
				},
				'nlapiGetLogin':{
					'': 10,
				},
				'nlapiLoadConfiguration':{
					'': 10,
				},
				'nlapiSubmitConfiguration':{
					'': 20,
				},
				'nlapiSendCampaignEmail':{
					'': 10,
				},
				'nlapiDeleteFile':{
					'': 20,
				},
				'nlapiSubmitFile':{
					'': 20,
				},
				'nlapiLoadFile':{
					'': 10,
				},
				'nlapiVoidTransaction':{
					'': 10,
				},
				'nlapiAttachRecord':{
					'': 10,
				},
				'nlapiDetachRecord':{
					'': 10,
				},
				'nlapiMergeRecord':{
					'': 10,
				},
				'nlapiRequestURLWithCredentials':{
					'': 10,
				},
				'nlapiXMLToPDF':{
					'': 10,
				},
				'nlapiLoadSearch':{
					'': 5,
				},
				'nlapiSetRecoveryPoint':{
					'': 100,
				},
				'nlapiSubmitCSVImport':{
					'': 100,
				}
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