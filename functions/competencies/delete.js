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
        const requestBody = JSON.parse(event.body);
        const competencyId = requestBody.CompetencyId;
		if (!("CompetencyId" in requestBody) || competencyId == "") {
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
				body: "This request must contain a non-empty CompetencyId with only numeric characters. You entered : " + competencyId,
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
            statusCode: 201,
            body: "The comptetency with the following id has been deleted - " + JSON.stringify(competencyId),
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