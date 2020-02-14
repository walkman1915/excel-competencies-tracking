let response;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const TRACKING_LOCATIONS_TO_COMPETENCIES_DDB_TABLE_NAME = process.env.TRACKING_LOCATIONS_TO_COMPETENCIES_DDB_TABLE_NAME; // Allows us to access the environment variables defined in the Cloudformation template

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
        
        // Information for the DELETE request needed to delete a new tracking location to competency

         // Information from the DELETE request needed to add a new tracking location to competency
         if (!("LocationId" in requestBody) || requestBody.LocationId == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'LocationId' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const locationId = requestBody.LocationId;

        if (!("CompetencyIds" in requestBody) || requestBody.CompetencyIds == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'CompetencyIds' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const competencyIds = requestBody.CompetencyIds;


        const locationName = requestBody.LocationName;
        
        // Construct the tracking location to competency object to delete from the database
        const key = {
            "LocationId": locationId,
            "CompetencyIds": competencyIds,
            "LocationName": locationName
        }

        console.log(key);
        // Delete the user in the database
        await deleteEval(key);
        
        // Generate the response for a successful delete
        response = {
            statusCode: 200,
            body: "Delete Successful",
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
 
 * @param {String} key - JSON object representing the key of the entry to remove
 * 
 * @returns {Object} object - a promise representing this delete request
 */
function deleteEval(key) {
    return ddb.delete({
        TableName: TRACKING_LOCATIONS_TO_COMPETENCIES_DDB_TABLE_NAME,
        Key: key
    }).promise();
}