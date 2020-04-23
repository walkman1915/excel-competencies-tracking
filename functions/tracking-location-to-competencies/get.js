let response;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const TRACKING_LOCATIONS_TO_COMPETENCIES_DDB = process.env.TRACKING_LOCATIONS_TO_COMPETENCIES_DDB; // Allows us to access the environment variables defined in the Cloudformation template

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
        
        //Log the received get request
        console.log("Recieved Get Request");
        //Instantiate the parameters that will be used for the get request
        //QueryInput doc: https://docs.aws.amazon.com/sdkforruby/api/Aws/DynamoDB/Types/QueryInput.html
        let params = AWS.DynamoDB.QueryInput = {
            TableName: TRACKING_LOCATIONS_TO_COMPETENCIES_DDB
        }
        //Gets the query parameters from the get request, expecting possibly the limit (number per page)
        //or exclusiveStartKey (what element to start from in the case of pagination)
        const queryStringParameters = event.queryStringParameters
        console.log(queryStringParameters);
        
        //Checks and gets the ExclusiveStartKey.  The queryparams need to be null-checked because if no params are provided
        //then the object will be null.  It is assumed that the ESK is base-64 encoded JSON (i.e. the exact same thing 
        //that was given back to the user in the previous response)
        if (queryStringParameters != null && "ExclusiveStartKey" in queryStringParameters && queryStringParameters.ExclusiveStartKey != "") {
             params.ExclusiveStartKey = JSON.parse(Buffer.from(queryStringParameters.ExclusiveStartKey,'base64').toString('binary'));
        }
        
        //Use the provided parameters to make the get API request
        const allTrackingLocations = await getTrackingLocationsToCompetencies(params);
        console.log(allTrackingLocations);
        // Generate the response body for a successful get
        
        let respBody = {};
        respBody.Items = allTrackingLocations.Items; //Gets the actual items from the call

        //Construct the response
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
 * Performs the API call on the table to get the results
 * 
 * @param {Object} params - a JSON representation of the params for the get request
 * 
 * @returns {Object} object - a promise representing this get request
 */
function getTrackingLocationsToCompetencies(params) {
    return ddb.scan(params).promise();
}