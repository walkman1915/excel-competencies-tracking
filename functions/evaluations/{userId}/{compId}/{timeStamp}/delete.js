let response;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const EVALUATIONS_DDB_TABLE_NAME = process.env.EVALUATIONS_DDB_TABLE_NAME; // Allows us to access the environment variables defined in the Cloudformation template

/**
 *
 * Event doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html#api-gateway-simple-proxy-for-lambda-input-format
 * @param {Object} event - API Gateway Lambda Proxy Input Format
 *
 * Context doc: https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html 
 * @param {Object} context
 *
 * Return doc: https://docs.aws.amazon.com/apigateway/latest/developerguide/set-up-lambda-proxy-integrations.html
 * @returns {Object} object - API Gateway Lambda Proxy Output Format
 * 
 */
exports.lambdaHandler = async (event, context) => {
    try {
        const requestBody = JSON.parse(event.body);

        
        // Information from the DELETE request needed to remove an evaluation
        // if (!("EvalId" in requestBody) || requestBody.EvalId == "") {
        //     response = {
		// 		statusCode: 400,
		// 		body: "This request is missing a necessary parameter - EvalId.",
		// 		headers: {
		// 			'Access-Control-Allow-Origin': '*',
		// 		},
		// 	}
		// 	return response;
        // }
        const evalId = event.pathParameters.userId;

        // if (!("CompetencyId_Timestamp" in requestBody) || requestBody.CompetencyId_Timestamp == "") {
        //     response = {
		// 		statusCode: 400,
		// 		body: "This request is missing a necessary parameter - CompetencyId_Timestamp.",
		// 		headers: {
		// 			'Access-Control-Allow-Origin': '*',
		// 		},
		// 	}
		// 	return response;
        // }
        const compId = event.pathParameters.compId;
        const timestamp = event.pathParameters.timeStamp;

        const compId_timestamp = compId + "_" + timestamp;

        //The key representing the parameters for the delete and get request
        //Note that AWS documentation will often tell you to format them like attrName: {"S": value}
        //but this does not actually work, you need to just do it like this
        key = {
            "UserIdBeingEvaluated": evalId,
            "CompetencyId_Timestamp": compId_timestamp
            
        }
        console.log(key)

        // Check if an evaluation with the given parameters is in the database
        const getResponse = await getEval(key);
        // console.log(JSON.stringify(getResponse));
        // Log the JSON object that was found in the database
        console.log(getResponse);
        //If the response didn't have an item in it (nothing was found in the database), return a 404 (not found)
        if (!("Item" in getResponse)) {
            response = {
                statusCode: 404,
                body: "An evaluation was not found with the given parameters",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        //Delete the evaluation from the database (at this point we know it's there)
        const delResponse = await deleteEval(key);
        
        // Generate the response for a successful post, include the JSON from the get request
        response = {
            statusCode: 200,
            body: "Delete Successful: " + JSON.stringify(getResponse),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};

/**
 * Deletes the item with the given key from the table
 
 * @param {Object} key - JSON object representing the key of the entry to remove
 * 
 * @returns {Object} object - a promise representing this delete request
 */
function deleteEval(key) {
    return ddb.delete({
        TableName: EVALUATIONS_DDB_TABLE_NAME,
        Key: key
    }).promise();
}

/**
 * Gets the item with the given key from the evals table, this will be used as a check
 * for whether or not the item is actually in the table
 * 
 * @param {Object} key - JSON object representing the key of the entry to get
 * 
 * @returns {Object} object - a promise representing this get request
 */
function getEval(key) {
    return ddb.get({
        TableName: EVALUATIONS_DDB_TABLE_NAME,
        Key: key
    }).promise();
}