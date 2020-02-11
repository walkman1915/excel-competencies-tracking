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
        // const requestBody = JSON.parse(event.body);

        // TODO: ADD MORE DATA VALIDATION
        // Information from the POST request needed to add a new user
        
        console.log("Recieved Get Request");
        // Put the user in the database
        const allEvals = await getEvals();
        console.log(allEvals);
        // Generate the response for a successful post
        response = {
            statusCode: 200,
            body: JSON.stringify(allEvals),
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
 * 
 * @returns {Object} object - a promise representing this get request
 */
function getEvals() {
    return ddb.scan({
        TableName: EVALUATIONS_DDB_TABLE_NAME,
    }).promise();
}