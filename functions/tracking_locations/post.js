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
        // Information from the POST request needed to add a new tracking location to competency
        
        // const locationId = requestBody.LocationId;
        
        const competencyIds = requestBody.CompetencyIds;
        if (!("CompetencyIds" in requestBody) || competencyIds == "") {
			response = {
				statusCode: 400,
				body: "This request is missing the required parameter - CompetencyIds.",
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
		}
        const locationName = requestBody.LocationName;
        if (!("LocationName" in requestBody) || locationName == "") {
			response = {
				statusCode: 400,
				body: "This request is missing the required parameter - LocationName.",
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
        }

        // unique locationID for now will just be locationName
        // @TODO find a way to grab the number of elements in the table and use this instead as the unique ID (get must be implemented first)
        const locationId = locationName;
        
        
        // Construct the tracking location to competency object to store in the database
        const tracking_location = {
            LocationId: locationId,
            CompetencyIds: competencyIds,
            LocationName: locationName
        }

        // Put the tracking location to competency in the database
        await addTrackingLocation(tracking_location);

        // Generate the response for a successful post
        response = {
            statusCode: 201,
            body: JSON.stringify(tracking_location),
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
 * Tracking Location to Competency object follows the format in the Database Table Structures document
 * @param {Object} tracking_location - JSON object representing a tracking location to competency to add to the database, with null for non-existing values
 * 
 * @returns {Object} object - a promise representing this put request
 */
function addTrackingLocation(tracking_location) {
    return ddb.put({
        TableName: TRACKING_LOCATIONS_TO_COMPETENCIES_DDB_TABLE_NAME_DDB_TABLE_NAME,
        Item: tracking_location,
    }).promise();
}