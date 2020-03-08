# Excel Competencies Tracking 

This describes the resources that make up the Excel Competencies Tracking System REST API v0. The Excel Program at Georgia Tech is a 4-year program for students with intellectual and developmental disabilities to develop life skills. This API provides a way to create, manage, export users and tracking data associated with the Excel Program.

For quick access to the following sections, select the hyperlinks below.
1. [Revelant Terms](#revelant-terms)
2. [API Calls For Evaluations](#evaluations)
3. [API Calls For Users & User Relationships](#users-and-user-relationships)
4. [API Calls For Competencies](#competencies)
5. [API Calls For TrackingLocations](#tracking-locations)
6. [Full API Tree](#api-tree)

## Relevant Terms

#### Competency
A demonstratable skill or knowledge achieved by a student. Each competency is associated with a domain and has a fixed evaluation schedule. Professors, __mentors__, and __coaches__ can input competency evaluations for students.

#### Tracking Location
A class, seminar, job, or other location that is associated with progress towards a compentency. Students and evaluators may be associated with one or more tracking location. 

#### Evaluation
Formal record of a student's progress towards a competency. 

#### Mentor

#### Coach

# Authentication

To be determined.

# API Calls

## Evaluations 

### Useful Parameters

_The following data parameters describe the sort information contained in an Evaluation entry._

- __UserId__ : (String, Required) The identification number of the user being evaluated. Must be a student.

- __CompetencyId__: (String, Required)  The identification tag of the competency being evaluated. View [Excel Tracking Table]() for a list of Competency Ids.

- __Year__: (String, Required)  Year this evaluation is being submitted for.

- __Month__: (String, Required)  Month this evaluation is being submitted for.  This is indexed at 0, so month 0 is January, 1 is February, etc.

- __Day__: (String, Required)  Day this evaluation is being submitted for.

- __UserIdEvaluator__: (String, Required) The identification number of the user evaluating. Must not be a student.

- __EvaluationScore__: (String, Required)  The numeric score that user received in the evalutation. View [Evaluation Score Table]() for a list of qualitative and competency speficic descriptions of these scores.

- __Comments__: (String, Optional)  Additional comments made by evaluator.

- __Evidence__: (String, Required) The mode of data that led to the evaluation. 

- __Approved__: (Boolean, Required) Indicates whether an administrator as approved this evaluation.

### Adding an Evaluation

You can add an evaluation by sending a POST request to the following address: <TBD>. In the body of the request there should be a JSON block of the following format. All parameters specified as required above must be filled out in this request.
```json
 {
   "UserId": "jdoe",
   "CompetencyId": "T6",
   "Year": "2020",
   "Month": "2",
   "Day": "28",
   "UserIdEvaluator": "asmith",
   "EvaluationScore": "3",
   "Evidence": "Assessment",
   "Approved": "False”
}
```
Once a request has been recieved it will give back __Status Code 201__, input the data in our database, and return a JSON block matching the data was entered in the sent body. Such as the example below. Note an optional data parameter, "Comments" was defaulted to being empty.
```json
 {
   "UserId": "jdoe",
   "CompetencyId": "T6",
   "Year": "2020",
   "Month": "2",
   "Day": "28",
   "UserIdEvaluator": "asmith",
   "EvaluationScore": "3",
   "Comments": "",
   "Evidence": "Assessment",
   "Approved": "False”
}
```
### Errors 

If a required data field is missing, the request will return a __Status Code 400__: Bad Request and the body of this response will contain a detailed message about which parameter was missing, malformed, or of the wrong type. For example consider the following input, which is missing the required parameter "CompetencyId".
```json
 {
   "UserId": "jdoe",
   "Year": "2020",
   "Month": "2",
   "Day": "28",
   "UserIdEvaluator": "asmith",
   "EvaluationScore": "3",
   "Evidence": "Assessment",
   "Approved": "False”
}
```
In addition to receiving a Status Code 400 response, the reponse's body would contain the following message.
```
  "Required body argument 'CompetencyId' was not specified"
```
[Back To Top](#excel-competencies-tracking)

## Users and User Relationships

[Back To Top](#excel-competencies-tracking)

## Competencies

### Useful Parameters

_The following data parameters describe the sort information contained in a Competencies entry._

- __CompetencyId__ : (String, Required) Unique identifier for this competency. Will not change even if the CompetencyTitle changes. Should only contain numeric digits.

- __CompetencyTitle__: (String, Required)  The human-readable title for this competency.

- __Domain__: (String, Required)  The main category of this competency. Permissible Values Include: {"TRANSPORTATION", "EMPLOYMENT_AND_CAREERS", "HEALTH_AND_WELLNESS", "FINANCIAL_LITERACY", "HOUSING", "SOCIAL_AND_LEADERSHIP", "TECHNOLOGY_AND_COMMUNICATION"}

- __Subcategory__: (String, Required)  Each domain can have unique subcategories.

- __Difficulty__: (String, Required)  How hard this competency is. Permissible Values Include : {"1" (basic), "2" "2" (intermediate), "3" (advanced), "4" (expert)}

- __EvaluationFrequency__: (String, Required) How often this competency is evaluated. Permissible Values Include: {"MONTHLY", "SEMESTERLY", "YEARLY"}

### Adding an Competency

You can add a competency by sending a POST request to the following address: "<endpoint_url>/competencies". In the body of the request there should be a JSON block of the following format. All parameters specified as required above must be filled out in this request.
```json
 {
	  "CompetencyId" : "2",
	  "CompetencyTitle" : "Calling an Uber/Lyft",
	  "Domain": "TRANSPORTATION",
	  "Subcategory" : "Modes of Transportation",
	  "Difficulty" : "2",
	  "EvaluationFrequency" : "SEMESTERLY"
}
```
Once a request has been recieved it will give back __Status Code 201__, input the data in our database, and return a JSON block matching the data was entered in the sent body. 
 
### Retrieving Competencies

All competencies can be retrieved with a GET request at the "<endpoint_url>/competencies" level. The response will contain a list of JSON values representing each competency in the master competencyies table list.

To retrieve a specific competency, we make a GET request at "<endpoint_url>/competencies/{competencyId}" level. To clarify, {competencyId} should be replaced with the competenctyId of the competency we want to retrieve. For example, a GET request to ""<endpoint_url>/competencies/2" will retrieve the competency with the id "2" or return a __Status Code 404__: Resource Not Found error if there does not exist a competency with the if "2".

When competencies are succesfully retrieved the resonse will have a __Status Code 200__.

### Removing Competencies

To delete a specific competency, we make a DELETE request at "<endpoint_url>/competencies/{competencyId}" level. To clarify, {competencyId} should be replaced with the competenctyId of the competency we want to retrieve. For example, a DELETE request to ""<endpoint_url>/competencies/2" will remove the competency with the id "2" or return a __Status Code 404__: Resource Not Found error if there does not exist a competency with the if "2".

When a competency is sucessfully deleted the response will have a __Status Code 204__.

### Errors 

If a required data field is missing or incorrect, the request will return a __Status Code 400__: Bad Request and the body of this response will contain a detailed message about which parameter was missing, malformed, or of the wrong type. For example consider the following input to a POST request (adding a competency), which is missing the required parameter "CompetencyId".
```json
 {
	  "CompetencyTitle" : "Calling an Uber/Lyft",
	  "Domain": "TRANSPORTATION",
	  "Subcategory" : "Modes of Transportation",
	  "Difficulty" : "2",
	  "EvaluationFrequency" : "SEMESTERLY"
}
```
In addition to receiving a Status Code 400 response, the reponse's body would contain the following message.
```
  "Required body argument 'CompetencyId' was not specified"
```

If a competency is not found during a GET or DELETE request, the reponse will be a __Status Code 404__: Resource not found.

[Back To Top](#excel-competencies-tracking)

## Tracking Locations

[Back To Top](#excel-competencies-tracking)

# API Tree
```
/competencies
   GET  [Get all competencies]
   POST [Add a new competency]
   /{competencyId}
       GET    [Get a specific competency given its id]
       DELETE [Delete a specific competency given its id]
/evaluations
   GET  [Get all evaluations]
   POST [Add a new evaluation]
   /{userId}
       GET  [Get all evaluations for a given specific user]
       /{compId}
           GET  [Get all evaluations for a given specific user and specific competency]
           /{timeStamp}
               GET    [Get all evaluations for a given specific user, specific competency, and specific time stamp]
               DELETE [Delete all evaluations for a given specific user, specific competency, and specific time stamp]
/evaluation_scale
    GET   [Get the evaluation scale]
    POST  [Add a new evaluation scale item]
/tracking_locations_to_competencies
    GET   [Get all tracking locations]
    POST  [Add a new tracking location]
    /{locationId}
        GET    [Get a specific tracking locations given its id]
        DELETE [Delete a specific tracking locations given its id]
/users
    POST   [Add a new user]
    /{userID}
        GET    [Get a specific user given their id]
        DELETE [Delete a specific user given their id]
    /mentors
        GET    [Get a all users that are mentors]
        /{userId}
           /students
               GET [Get all students associated with the mentor who has the passed in userId]
    /students
        /{userId}
           /mentors
               GET [Get all mentors associated with the student who has the passed in userId]
/users-to-tracking-location
    POST   [Add a new user to tracking location relationship]
    GET    [Get all user to tracking location relationships]
    /{trackingLocationId}
        /{getAllUsersFlag} [If "true" will get user objects, otherwise user ids]
            GET    [Get a all users being tracked in a  give tracking location]
    /users
        /{userId}
           DELETE [Delete a specific user to tracking location relationship]
```
