module.exports.validateField = function valField(requestBody, field) {
    console.log("checking validity of - " + field);
    if (!(field in requestBody) || requestBody[field] == "") {
        response = {
            statusCode: 400,
            body: "Required body argument '" + field + "' was not specified",
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }
        console.log("invalid field - " + field);
        return response;
    } else {
        console.log(field + " - is valid");
        return null;
    }
}

module.exports.optionalField = function optField(requestBody, field) {
    return (field in requestBody && requestBody[field] != "")  ? requestBody[field ]: null;
}

module.exports.fieldIncludes = function memberOf(requestBody, field, possValues) {
    if (!(possValues.includes(requestBody[field]))) {
        response = {
            statusCode: 400,
            body: "Given field '" + field + "' was not valid, given value: '" + requestBody[field] + "'. Expected values: " + possValues.toString(),
            headers: {
                'Access-Control-Allow-Origin': '*',
            },
        }
        console.log("field does contain a valid value - " + field);
        return response;
    } else {
        console.log(field + " contains a valid value");
        return null;
    }
}