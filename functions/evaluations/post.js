let response;

const auth = require('/opt/auth');
const validate = require('/opt/validate');
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const EVALUATIONS_DDB_TABLE_NAME = process.env.EVALUATIONS_DDB_TABLE_NAME; // Allows us to access the environment variables defined in the Cloudformation template

/*CONSTANT VALUES */
const REQUIRED_ARGS = ["UserId", "CompetencyId", "Year", "Month", "Day", "UserIdEvaluator", "EvaluationScore", "Comments", "Evidence", "Approved"];
const VALID_EVIDENCE = ["Direct observation", "Assessment", "Report from employer", "Report from coach"];
const VALID_EVAL_SCORES = ["0", "1", "2", "3", "4", "N"];
const validRoles = ["Admin", "Faculty/Staff", "Coach", "Mentor"];


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
        console.log(event.requestContext);
        let indicator = auth.verifyAuthorizerExistence(event);
        if (indicator != null) {
            return indicator;
        }
        indicator = auth.verifyValidRole(event, validRoles);
        if (indicator != null) {
            return indicator;
        }



        const requestBody = JSON.parse(event.body);
        
        // Information from the POST request needed to add a new evaluation
        
        for (i = 0; i < REQUIRED_ARGS.length; i++) {
            ret = validate.validateField(requestBody, REQUIRED_ARGS[i]);
            if (ret != null) {
                return ret;
            }
        }

        const userId = requestBody.UserId;

        const compId = requestBody.CompetencyId;

        let now = new Date();
        const timeStamp = now.toISOString();

        const comp_stamp = compId + "_" + timeStamp;

        const year = requestBody.Year;

        //Note, the date is indexed at 0, so 11 is December, 10 is November, etc.
        const month = requestBody.Month;

        //The day is not indexed at 0, a day of 6 is the 6th of the month
        const day = requestBody.Day;

        const evalTime = new Date(year, month, day);
        const dateEvaluated = evalTime.toISOString();
        if (evalTime > now) {
            response = {
                statusCode: 400,
                body: "Given time of evaluation is in the future",
                headers: {
                    'Access-Control-Allow-Origin': '*',
                },
            }
            return response;
        }

        const userIdEvaluator = requestBody.UserIdEvaluator;

        const evalScore = requestBody.EvaluationScore;

        ret = validate.fieldIncludes(requestBody, "EvaluationScore", VALID_EVAL_SCORES);
        if (ret != null) {
            return ret;
        }

        //TODO: Should comments be optional, or at least allowed to be blank?
        const comments = requestBody.Comments;

        const evidence = requestBody.Evidence;

        ret = validate.fieldIncludes(requestBody, "Evidence", VALID_EVIDENCE);
        if (ret != null) {
            return ret;
        }

        const approved = requestBody.Approved;


        // Construct the eval object to store in the database
        const eval = {
            UserIdBeingEvaluated: userId,
            CompetencyId_Timestamp: comp_stamp,
            Timestamp: timeStamp,
            UserIdEvaluator: userIdEvaluator,
            DateEvaluated: dateEvaluated,
            EvaluationScore: evalScore,
            Comments: comments,
            Evidence: evidence,
            Approved: approved
        }

        // Put the evaluation in the database
        await addEval(eval);

        // Generate the response for a successful post
        response = {
            statusCode: 200,
            body: JSON.stringify(eval),
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
 * Eval object follows the format in the Database Table Structures document
 * @param {Object} eval - JSON object representing a new evaluation to add to the database, with null for non-existing values
 * 
 * @returns {Object} object - a promise representing this put request
 */
function addEval(eval) {
    return ddb.put({
        TableName: EVALUATIONS_DDB_TABLE_NAME,
        Item: eval,
    }).promise();
}

// /**
//  * Verifies that the event contains an authorizer with some claims
//  * @param {Object} event the event object from the lambda
//  * @returns the error response that should be returned if the authorizer is incorrect,
//  * else returns null to indicate success
//  */
// function verifyAuthorizerExistence(event) {
//     if (!("authorizer" in event.requestContext) || !("claims" in event.requestContext.authorizer)) {
//         response = {
//             statusCode: 401,
//             body: "Authorization is missing from request",
//             headers: {
//                 'Access-Control-Allow-Origin': '*',
//             },
//         }
//         return response;
//     }
//     return null;
// }

// function verifyValidRole(event, validRoles) {
//     if (!("custom:role" in event.requestContext.authorizer.claims)) {
//         response = {
//             statusCode: 403,
//             body: "User does not have any assigned role",
//             headers: {
//                 'Access-Control-Allow-Origin': '*',
//             },
//         }
//         return response;
//     }
//     const role = event.requestContext.authorizer.claims['custom:role'];
//     if (!validRoles.includes(role)) {
//         response = {
//             statusCode: 403,
//             body: "User role is not permitted to perform this action. Role " + role 
//             + " must be one of " + validRoles.toString(),
//             headers: {
//                 'Access-Control-Allow-Origin': '*',
//             },
//         }
//         return response;
//     }
//     return null;
// }