let response;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const COMPETENCIES_DDB_TABLE_NAME = process.env.COMPETENCIES_DDB_TABLE_NAME; // Allows us to access the environment variables defined in the Cloudformation template

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
        const competencyId = event.pathParameters.competencyId;

		if (isEmptyObject(competencyId)) {
			response = {
				statusCode: 400,
				body: "This request is missing a necessary parameter - CompetencyId.",
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
         } else if (!/^\d+$/.test(competencyId)) {
			response = {
				statusCode: 400,
				body: "This request must contain a non-empty CompetencyId with only numeric characters. You entered : " + JSON.stringify(competencyId),
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
			return response;
		}

        // Check if an evaluation with the given parameters is in the database
        const getResponse = await getCompetency(competencyId);

       
        //If the response didn't have an item in it (nothing was found in the database), return a 404 (not found)
        if (!("Item" in getResponse)) {
            response = {
                statusCode: 404,
                body: "A comptetency was not found with the given id  - " + competencyId,
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }


        // Remove a competency from the database
        await removeCompetency(competencyId);

        // TODO : It still returns success when the id was valid (a number) but did not actually exists in the database (ie nothing happened)
        // Generate the response for a successful delete
        response = {
            statusCode: 204,
            body: "The comptetency with the following id has been deleted - " + competencyId,
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
 * @param {Object} competencyId - the competencyId key that will be removed from the database
 * 
 * @returns {Object} object - a promise representing this delete request
 */
function removeCompetency(competencyId) {
    return ddb.delete({
        TableName: COMPETENCIES_DDB_TABLE_NAME,
        Key: {
            "CompetencyId" : competencyId,
        }
    }).promise();
}

/**
 * @param {Object} competencyId - the competencyId key that will be removed from the database
 * 
 * @returns {Object} object - a promise representing this delete request
 */
function getCompetency(competencyId) {
    return ddb.get({
        TableName: COMPETENCIES_DDB_TABLE_NAME,
        Key: {
            "CompetencyId" : competencyId,
        }
    }).promise();
}

/**
 * Checks if the provided JSON object is empty {} or not
 * @param {JSON} obj - The object to check for emptiness
 * 
 * @returns {boolean} True if this JSON object is empty, false if it is not empty
 */
function isEmptyObject(obj) {
    for (var key in obj) {
        if (Object.prototype.hasOwnProperty.call(obj, key)) {
        return false;
        }
    }
    return true;
}