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

        // TODO: ADD MORE DATA VALIDATION
        
        
        console.log("Recieved Get Request");
        let params = AWS.DynamoDB.QueryInput = {
            TableName: EVALUATIONS_DDB_TABLE_NAME
        }
        const queryStringParameters = event.queryStringParameters
        console.log(queryStringParameters);
        if (queryStringParameters != null && "ExclusiveStartKey" in queryStringParameters && queryStringParameters.ExclusiveStartKey != "") {
             params.ExclusiveStartKey = JSON.parse(Buffer.from(queryStringParameters.ExclusiveStartKey,'base64').toString('binary'));
        }
        params.Limit = 2;
        
        const allEvals = await getEvals(params);
        console.log(allEvals);
        // Generate the response for a successful get
        
        respBody = {};
        respBody.Items = allEvals.Items;
        if ("LastEvaluatedKey" in allEvals) {
            respBody.LastEvaluatedKey = Buffer.from(JSON.stringify(allEvals.LastEvaluatedKey),'binary').toString('base64');
        }
        response = {
            statusCode: 200,
            body: JSON.stringify(respBody),
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
 * 
 * @param {Object} params - a JSON representation of the params for the get request
 * 
 * @returns {Object} object - a promise representing this get request
 */
function getEvals(params) {
    return ddb.scan(params).promise();
}