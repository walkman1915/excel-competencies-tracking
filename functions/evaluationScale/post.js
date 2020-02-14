let response;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const EVALUATION_SCALE_DDB_TABLE_NAME = process.env.EVALUATION_SCALE_DDB_TABLE_NAME; // Allows us to access the environment variables defined in the Cloudformation template
const validEvaluationScores = ["0", "1", "2", "3", "4"];
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

        //Data validation
   
        //EvaluationScore doesn't exist
        if (!("EvaluationScore" in requestBody) || requestBody.EvaluationScore == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'EvaluationScore' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }

        const evaluationScore = requestBody.EvaluationScore;
        //evaluationScore isn't in the range of 0 to 4
        if (!(validEvidence.includes(evaluationScore))) {
            response = {
                statusCode: 400, //bad request error code
                body: "EvaluationScore was not valid, given value: '" + evaluationScore + "'. Expected values: " + validEvaluationScores.toString(),
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }

        //Title doesn't exist
        if (!("Title" in requestBody) || requestBody.Title == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'Title' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const title = requestBody.Title;

        //Frequency doesn't exist
        if (!("Frequency" in requestBody) || requestBody.Frequency == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'Frequency' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const frequency = requestBody.Frequency;

        //Support doesn't exist
        if (!("Support" in requestBody) || requestBody.Support == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'Support' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const support = requestBody.Support;

        //Explanation doesn't exist
        if (!("Explanation" in requestBody) || requestBody.Explanation == "") {
            response = {
                statusCode: 400,
                body: "Required body argument 'Explanation' was not specified",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }
        const explanation = requestBody.Explanation;

        
        // Example of optional field checking
        //const cohort = ("Cohort" in requestBody && requestBody.Cohort != "")  ? requestBody.Cohort : null;
        // Construct the Evaluation Scale object to store in the database
        const evaluationScale = {
            EvaluationScore: evaluationScore,
            Title: title,
            Frequency: frequency,
            Support: support,
            Explanation: explanation
        }

        // Put the user in the database
        await addEvaluationScale(evaluationScale);

        // Generate the response for a successful post
        response = {
            statusCode: 201,
            body: JSON.stringify(evaluationScale),
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
 * User object follows the format in the Database Table Structures document
 * @param {Object} evaluationScale - JSON object representing a user to add to the database, with null for non-existing values
 * 
 * @returns {Object} object - a promise representing this put request
 */
function addEvaluationScale(evaluationScale) {
    return ddb.put({
        TableName: EVALUATION_SCALE_DDB_TABLE_NAME,
        Item: evaluationScale,
    }).promise();
}