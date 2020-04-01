let response;

const auth = require('/opt/auth');
const validRoles = ["Admin", "Faculty/Staff", "Coach", "Mentor"];
const validate = require('/opt/validate');
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const EVALUATION_SCALE_DDB_TABLE_NAME = process.env.EVALUATION_SCALE_DDB_TABLE_NAME; // Allows us to access the environment variables defined in the Cloudformation template

const REQUIRED_ARGS = ["EvaluationScore", "Title", "Frequency", "Support", "Explanation"];
const VALID_EVIDENCE = ["0", "1", "2", "3", "4"];
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
        let indicator = auth.verifyAuthorizerExistence(event);
        if (indicator != null) {
            return indicator;
        }
        indicator = auth.verifyValidRole(event, validRoles);
        if (indicator != null) {
            return indicator;
        }
        const requestBody = JSON.parse(event.body);

        //Data validation

        console.log("attempting validation");

        for (i = 0; i < REQUIRED_ARGS.length; i++) {
            ret = validate.validateField(requestBody, REQUIRED_ARGS[i]);
            if (ret != null) {
                return ret;
            }
        }

        const evaluationScore = requestBody.EvaluationScore;

        ret = validate.fieldIncludes(requestBody, "EvaluationScore", VALID_EVIDENCE);
        if (ret != null) {
            return ret;
        }

        const title = requestBody.Title;

        const frequency = requestBody.Frequency;

        const support = requestBody.Support;

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
            statusCode: 200,
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