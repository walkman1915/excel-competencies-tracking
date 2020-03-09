let response;

const validate = require('/opt/validate');
const AWS = require('aws-sdk');
const ddb = new AWS.DynamoDB.DocumentClient();
const COMPETENCIES_DDB_TABLE_NAME= process.env.COMPETENCIES_DDB_TABLE_NAME; 

/* CONSTANTS */
const REQUIRED_ARGS = ["CompetencyId", "CompetencyTitle", "Domain", "Subcategory", "Importance", "Difficulty", "EvaluationFrequency"];
const VALID_DOMAINS = ["TRANSPORTATION", "EMPLOYMENT_AND_CAREERS", "HEALTH_AND_WELLNESS", "FINANCIAL_LITERACY", "HOUSING", "SOCIAL_AND_LEADERSHIP", "TECHNOLOGY_AND_COMMUNICATION"];
const VALID_DIFFICULTY = ["1", "2", "3", "4"];
const VALID_FREQUENCIES = ["MONTHLY", "SEMESTERLY", "YEARLY"];


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


        // check that each required field is valid
        for (i = 0; i < REQUIRED_ARGS.length; i++) {
            ret = validate.validateField(requestBody, REQUIRED_ARGS[i]);
            if (ret != null) {
                return ret;
            }
		}
		
        // check if Role is one of the acceptable values
        ret = validate.fieldIncludes(requestBody, "Domain", VALID_DOMAINS);
        if (ret != null) {
            return ret;
		}
		
		ret = validate.fieldIncludes(requestBody, "Difficulty", VALID_DIFFICULTY);
        if (ret != null) {
            return ret;
		}

		ret = validate.fieldIncludes(requestBody, "EvaluationFrequency", VALID_FREQUENCIES);
        if (ret != null) {
            return ret;
		}

		const competencyId = requestBody.CompetencyId;
		
        const competencyTitle = requestBody.CompetencyTitle;
		
		const domain = requestBody.Domain;

		const subcategory = requestBody.Subcategory;

		const importance = requestBody.Importance;

		const difficulty = requestBody.Difficulty;

		const evaluationFrequency = requestBody.EvaluationFrequency;

        //const uniqueEvaluationScale = ("UniqueEvaluationScale" in requestBody && requestBody.UniqueEvaluationScale != "")  ? requestBody.UniqueEvaluationScale : null;
		
		// Since unique evaluation is future work it's optional
		const uniqueEvaluationScale = validate.optionalField(requestBody, "UniqueEvaluationScale");

        // Construct the competency object to store in the database
        const competency = {
            CompetencyId : competencyId,
			CompetencyTitle : competencyTitle,
            Domain : domain,
			Subcategory: subcategory,
			Importance: importance,
            Difficulty: difficulty,
            EvaluationFrequency: evaluationFrequency,
			UniqueEvaluationScale : uniqueEvaluationScale
        }

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
       
    } catch (err) {
        console.log(err);
        return err;
    }

    return response
};

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