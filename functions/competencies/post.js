let response;

const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const COMPETENCIES_DDB_TABLE_NAME= process.env.COMPETENCIES_DDB_TABLE_NAME; 

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
		isValid = true;
		//var error_message = "";

        // TODO: ADD MORE DATA VALIDATION
        const competencyId = ("CompetencyId" in requestBody && requestBody.CompetencyId != "")  ? requestBody.CompetencyId : "999";
		//isValid = validate("ComptencyId", competencyId, error_message);
        
		const competencyTitle = requestBody.CompetencyTitle;
		//isValid = isValid && validate("ComptencyTitle", competencyTitle, error_message);

		const domain = requestBody.Domain;
		//isValid = isValid && validate("Domain", domain, error_message);

		const subcategory = requestBody.Subcategory;
		//isValid = isValid && validate("Subcategory", subcategory, error_message);

		const difficulty = requestBody.Difficulty;
		//isValid = isValid && validate("Difficulty", difficulty, error_message);

		const evaluationFrequency = requestBody.EvaluationFrequency;
		//isValid = isValid && validate("EvaluationFrequency", evaluationFrequency, error_message);

        // Since unique evaluation is future work it's optional
        const uniqueEvaluationScale = ("UniqueEvaluationScale" in requestBody && requestBody.UniqueEvaluationScale != "")  ? requestBody.UniqueEvaluationScale : null;
        
        // Construct the competency object to store in the database
        const competency = {
            CompetencyId : competencyId,
			CompetencyTitle : competencyTitle,
            Domain : domain,
            Subcategory: subcategory,
            Difficulty: difficulty,
            EvaluationFrequency: evaluationFrequency,
			UniqueEvaluationScale : uniqueEvaluationScale
        }

		if (isValid) {
			// Put the user in the database
			await addComp(competency);

			// Generate the response for a successful post
			response = {
				statusCode: 201,
				body: JSON.stringify(competency),
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
		} else {
			// Response is malformed and we should return this information
			response = {
				statusCode: 400,
				body: JSON.stringify(error_message),
				headers: {
					'Access-Control-Allow-Origin': '*',
				},
			}
		}
       
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};

/**
 * Checks that the input parameter is not missing or empty
 * @param {String} name - String representing the name of parameter we are testing, used to build error message
 * @param {String} parameter - String representing the parameter taken from the request body
 * @param {Object} error_message - String a running list of the bad input errors from this request
 * 
 * @returns {Boolean} boolean - that will return true when the parameter exists and is not empty
 
function validate(name, parameter, error_message) {
	if (parameter == null) {
		error_message = error_message + "This request is missing a necessary parameter - ${name}. \n";
		return false;
	} else if (parameter == "") {
		error_message = error_message + "This request is contains an empty parameter that must have data - ${name}. \n");
		return false;
	} 
	return true;
}
*/

/**
 * Competencies object  follows the format in the Database Table Structures document
 * @param {Object} competency - JSON object representing a competency to add to the database, with null for non-existing values
 * 
 * @returns {Object} object - a promise representing this put request
 */
function addComp(competency) {
    return ddb.put({
        TableName: COMPETENCIES_DDB_TABLE_NAME,
        Item: competency,
    }).promise();
}