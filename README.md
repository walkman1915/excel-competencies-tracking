# Excel Competencies Tracking 

This describes the resources that make up the Excel Competencies Tracking System REST API v0. The Excel Program at Georgia Tech is a 4-year program for students with intellectual and developmental disabilities to develop life skills. This API provides a way to create, manage, export users and tracking data associated with the Excel Program.

For quick access to the following sections, select the hyperlinks below.
1. [Revelant Terms](#revelant-terms)
2. [API Calls For Evaluations](#evaluations)
3. [API Calls For Users & User Relationships](#users-and-user-relationships)
4. [API Calls For Competencies](#competencies)
5. [API Calls For TrackingLocations](#tracking-locations)
6. [API Calls For User Association with Tracking Locations and Other Users](#user-association-with-tracking-locations-and-other-users)
7. [API Calls For EvaluationScales](#evaluation-scale)
8. [Full API Tree](#api-tree)

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

You can add an evaluation by sending a POST request to the following address: <endpoint_url>/evaluations. In the body of the request there should be a JSON block of the following format. All parameters specified as required above must be filled out in this request.
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
### Retrieving All Evaluations

To retrieve all evaluations in the table, send a GET request to the following address: <endpoint_url>/evaluations.

To retrieve all of the evaluations for a specific user, send a GET request to the following address: <endpoint_url>/evaluations/{userId} , where {userId} is the UserId of the user you are scanning the table for. For example, if the userId in question is 2, then the url looks like this: <endpoint_url>/evaluations/2.

To retrieve all of the evaluations for a specific user in a specific competency, send a GET request to the following address: <endpoint_url>/evaluations/{userId} /{compId} , where {userId} is the UserId of the user you are scanning the table for and {compId} is the CompetencyId of the competency you are scanning the table for. For example, if the userId in question is 2 and the compId in question is 4, then the url looks like this: <endpoint_url>/evaluations/2/4.

To retrieve the evaluation for a specific user in a specific competency with a specific timestamp, send a GET request to the following address: <endpoint_url>/evaluations/{userId}/{compId}/{timeStamp} , where {userId} is the UserId of the user you are scanning the table for, {compId} is the CompetencyId of the competency you are scanning the table for, and {timeStamp} is the specific timestamp of the evaluation you are looking for. For example, if the userId in question is 2, the compId in question is 4, and the timestamp is 2019-11-17T21:54:50.635Z, then the url looks like this: <endpoint_url>/evaluations/2/4/2019-11-17T21:54:50.635Z.

### Deleting Evaluations 

To delete the evaluation for a specific user in a specific competency with a specific timestamp, send a DELETE request to the following address: <endpoint_url>/evaluations/{userId}/{compId}/{timeStamp} , where {userId} is the UserId of the student you are scanning the table for, {compId} is the CompetencyId of the competency you are scanning the table for, and {timeStamp} is the specific timestamp of the evaluation you are looking for in order to delete. For example, if the userId in question is 2, the compId in question is 4, and the timestamp is 2019-11-17T21:54:50.635Z, then the url looks like this: <endpoint_url>/evaluations/2/4/2019-11-17T21:54:50.635Z.

[Back To Top](#excel-competencies-tracking)


## Users and User Relationships

### Useful Parameters

_The following data parameters describe the sort information contained in an Evaluation Scale entry._

- __UserId__: (String, Required)  Unique ID of the user; also used for log-in -- this is their username that they use for login

- __UserInfo__: (Map, Required)  Name, email, and any other info stored about each user


- __Role__: (String, Required)  Tells what this user’s role is in the system. Permissible values: “Faculty/Staff”, “Admin”, “Student (current)”, “Student (graduate)”, “Student (other)”, “Coach”, “Mentor”
Note that the term “student’ above refers to a student in the Excel program; coaches and mentors are technically GT students, but are not considered students in this system


- __Cohort__: (String, Optional)  Only applicable for Excel students -- other roles will not have a value for this. Represents which cohort the student is a part of. The first entering class of the Excel Program is Cohort 1. The next year’s entering class is Cohort 2, etc. The client wants to be able to pull all reports for a given cohort to see the progression from semester to semester as an entire group

- __GTId__: (String, Optional) The GT ID of this user

### Adding a User

You can add a user by sending a POST request to the following address: <endpoint_url>/users. In the body of the request there should be a JSON block of the following format. All parameters specified as required above must be filled out in this request.
```json
 {
   "UserId": "janedoe",
   "UserInfo": {
     "name": "Jane Doe",
     "email": "JaneDoe@gatech.edu"
    },
   "Role": "Student (current)",
   "Cohort": "2",
   "GTId": "999555444",
}
```
Once a request has been recieved it will give back __Status Code 201__, input the data in our database, and return a JSON block matching the data was entered in the sent body. Such as the example below. 
```json
 {
   "UserId": "janedoe",
   "UserInfo": {
     "name": "Jane Doe",
     "email": "JaneDoe@gatech.edu"
   },
   "Role": "Student (current)",
   "Cohort": "2",
   "GTId": "999555444",
}
```

### Retrieving a User 	

To retrieve a specific user, we make a GET request at "<endpoint_url>/users/{userId}" level. To clarify, {userId} should be replaced with the userId of the user we want to remove. For example, a GET request to ""<endpoint_url>/users/2" will remove the user with the id "2" or return a Status Code 404: Resource Not Found error if there does not exist a user with the id "2".

When a user is sucessfully retrieved the response will have a Status Code 200.

### Deleting a User 

To delete a specific user, we make a DELETE request at "<endpoint_url>/users/{userId}" level. To clarify, {userId} should be replaced with the userId of the user we want to remove. For example, a DELETE request to ""<endpoint_url>/users/2" will remove the user with the id "2" or return a Status Code 404: Resource Not Found error if there does not exist a user with the id "2".

When a user is sucessfully deleted the response will have a Status Code 200.

[Back To Top](#excel-competencies-tracking)


## Competencies

### Useful Parameters

_The following data parameters describe the sort information contained in a Competencies entry._

- __CompetencyId__ : (String, Required) Unique identifier for this competency. Will not change even if the CompetencyTitle changes. Should only contain numeric digits.

- __CompetencyTitle__: (String, Required)  The human-readable title for this competency.

- __Domain__: (String, Required)  The main category of this competency. Permissible Values Include: {"TRANSPORTATION", "EMPLOYMENT_AND_CAREERS", "HEALTH_AND_WELLNESS", "FINANCIAL_LITERACY", "HOUSING", "SOCIAL_AND_LEADERSHIP", "TECHNOLOGY_AND_COMMUNICATION"}

- __Subcategory__: (String, Required)  Each domain can have unique subcategories.

- __Difficulty__: (String, Required)  How hard this competency is. Permissible Values Include : {"1" (basic), "2" (intermediate), "3" (advanced), "4" (expert)}

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

To retrieve a specific competency, we make a GET request at "<endpoint_url>/competencies/{competencyId}" level. To clarify, {competencyId} should be replaced with the competenctyId of the competency we want to retrieve. For example, a GET request to ""<endpoint_url>/competencies/2" will retrieve the competency with the id "2" or return a __Status Code 404__: Resource Not Found error if there does not exist a competency with the id "2".

When competencies are succesfully retrieved the response will have a __Status Code 200__.

### Removing Competencies

To delete a specific competency, we make a DELETE request at "<endpoint_url>/competencies/{competencyId}" level. To clarify, {competencyId} should be replaced with the competenctyId of the competency we want to retrieve. For example, a DELETE request to ""<endpoint_url>/competencies/2" will remove the competency with the id "2" or return a __Status Code 404__: Resource Not Found error if there does not exist a competency with the id "2".

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

### Useful Parameters

_The following data parameters describe the sort information contained in TrackingLocationToCompetency entry._

- __LocationId__ : (String, Auto-generated) The unique Id of a given location (either a class name or a type of advising). This Id will not change even if a location's name changes. When a POST request is made, the database is scanned to see if an entry already exists with the same __LocationName__. If so, that specific __LocationId__ will be used. If not, a new and unique __LocationId__ is automatically generated.

- __CompetencyIds__: (String, Required) A list of CompetencyIds that a given location is currently tracking. Note that the Ids of the Competencies are stored instead of the names (since the latter is more likely to change).

- __LocationName__: (String, Required) Human readable name of the given location or the advising location name. The three valid types of advising are: {“Advising (academic)”, “Advising (social)”, “Advising (career)”}.

### Adding a Tracking Location

You can add a competency by sending a POST request to the following address: "<endpoint_url>/tracking-location-to-competencies". In the body of the request there should be a JSON block of the following format. All parameters specified as required above must be filled out in this request.
```json
 {  
	  "CompetencyIds": ["001","002","003"],
	  "LocationName" : "2",
 }
```
Once a request has been recieved it will give back __Status Code 201__, input the data in our database, and return a JSON block matching the data was entered in the sent body. 

### Removing a Tracking Location

To delete a specific tracking location, we make a DELETE request at "<endpoint_url>/tracking-location-to-competencies/{locationId}" level. To clarify, {locationId} should be replaced with the locationId of the tracking location we want to remove. For example, a DELETE request to ""<endpoint_url>/tracking-location-to-competencies/2" will remove the tracking location with the id "2" or return a __Status Code 404__: Resource Not Found error if there does not exist a tracking location with the id "2".

When a tracking location is sucessfully deleted the response will have a __Status Code 200__.

### Retrieving a Tracking Location

To retrieve a specific tracking location, we make a GET request at "<endpoint_url>/tracking-location-to-competencies/{locationId}" level. To clarify, {locationId} should be replaced with the locationId of the tracking location we want to retrieve. For example, a DELETE request to ""<endpoint_url>/tracking-location-to-competencies/2" will retrieve the tracking location with the id "2" or return a __Status Code 204__: that the action was successful but a tracking location with the id "2" does not exist in the database.

When a tracking location is succesfully retrieved the response will have a __Status Code 200__.

[Back To Top](#excel-competencies-tracking)

## User Association with Tracking Locations and Other Users

### Useful Parameters

_The following data parameters describe the sort information contained in TrackingLocation entry._

- __UserId__ : (String, Required) Unique ID of the user being tracked in a given location.

- __LocationIds__: (String, Required for __non-mentors__) A list of LocationIds that a user is currently being tracked in. Only non-mentor users can have LocationIds associated with them.

- __StudentIds__: (String, Required for __mentors__) If this user is a mentor or peer coach, this is a list of all students that this mentor/peer coach is assigned to. If this user is something else, this field will be empty

### Associating a Student/Teacher with Tracking Locations 

You can create this relationship by sending a __POST__ request to the following address: __"<endpoint_url>/user-to-tracking-location"__. In the body of the request there should be a JSON block of the following format. All parameters specified as required above must be filled out in this request.
```json
{
    "LocationIds": [
        "ClassA",
        "ClassB",
        "ClassV"
    ],
    "UserId": "janeDoe7"
}
```
Once a request has been recieved it will give back __Status Code 201__, input the data in our database, and return a JSON block matching the data was entered in the sent body. Note that the previously mentioned parameter, "StudentIds" is not listed and that it will be set to null for a non-mentor.

In order for the POST to sucessfully execute the following conditions must be met:
- The user corresponding to UserId must be an existing user and not be a mentor
- All LocationIds entered must correspond to exisitng locations already stored in the database
 
### Associating a Mentor with Students

You can create this relationship by sending a __POST__ request to the following address: __"<endpoint_url>/user-to-tracking-location"__. In the body of the request there should be a JSON block of the following format. All parameters specified as required above must be filled out in this request. Note that we only need to add students to a mentor's list of studentIds, there is no need to also attempt to create the reverse relationship (adding a mentor to a student's list of mentors.) 
```json
{
    "StudentIds": [
        "johnDoe12",
        "otherStudent1",
        "someoneElse45"
    ],
    "UserId": "janeDoe7"
}
```
Once a request has been recieved it will give back __Status Code 201__, input the data in our database, and return a JSON block matching the data was entered in the sent body. Note that the previously mentioned parameter, "LocationIds" is not listed and that it will be set to null for a mentor.

In order for the POST to sucessfully execute the following conditions must be met:
- The user corresponding to UserId must be an existing user and be a mentor
- All StudentIds entered must correspond to exisitng students users

### Retrieving All Students associated with a Mentor

All students assigned to a given mentor can be retrieved with a __GET__ request at the __"<endpoint_url>/users/mentors/{userId}/students"__ level. The response will contain a list of JSON objects, each representing the user information of students mentored. To clarify, {userId} should be replaced with the userId of the mentor user whose students we want to locate. For example, a GET request to "<endpoint_url>/users/students/janeDoe7/mentors" will retrieve all students associated with the mentor "janeDoe7".

When students are succesfully retrieved the response will have a __Status Code 200__.
If there does not exist a mentor user with {userId} the response will have a __Status Code 404__: Resource Not Found.

### Retrieving All Mentors associated with a Student

All mentors assigned to a given student can be retrieved with a __GET__ request at the __"<endpoint_url>/users/students/{userId}/mentors"__ level. The response will contain a list of JSON objects, each representing the user information of the mentors. To clarify, {userId} should be replaced with the userId of the student user whose mentors we want to locate. For example, a GET request to "<endpoint_url>/users/students/johnDoe12/mentors" will retrieve all mentors associated with the student "johnDoe12".

When mentors are succesfully retrieved the response will have a __Status Code 200__.
If there does not exist a student user with {userId} the response will have a __Status Code 404__: Resource Not Found.

### Retrieving All Students associated with a Tracking Location

All students associated with a given tracking location can be retrieved with a __GET__ request at the __"<endpoint_url>/users-to-tracking-location/{trackingLocationId}"__ level. The response will contain a list of JSON objects, each representing the user information of the students. To clarify, {trackingLocationId} should be replaced with the LocationId of the course whose students we want to locate. For example, a GET request to "<endpoint_url>/users-to-tracking-location/ClassA" will retrieve all students associated with "ClassA".

When students are succesfully retrieved the response will have a __Status Code 200__.
If there does not exist a course with {trackingLocationId} or there are no students associated with the course the response will have a __Status Code 404__: Resource Not Found.

### Removing Relationships

To delete a specific relationship, (either between mentors and students or betweeen students and tracking locations)  we make a __DELETE__ request at __"<endpoint_url>/user-to-tracking-location/users/{userId}"__ level. To clarify, {userId} should be replaced with the userId of the user whose associations we want to remove. For example, a DELETE request to "<endpoint_url>/user-to-tracking-location/users/johnDoe12" will remove the association of this student with tracking locations. __Note that this would not remove this student from being associated with various mentors.__ To remove all of a mentor's student associations we would have input the mentor]s userId instead.

If the userId is not associated with any relationships the response will have a __Status Code 404__: Resource Not Found.

When a relationship is sucessfully deleted the response will have a __Status Code 204__.

[Back To Top](#excel-competencies-tracking)

## Evaluation Scale 

### Useful Parameters

_The following data parameters describe the sort information contained in an Evaluation Scale entry._

- __EvaluationScore__ : (String, Required) A number on the evaluation scale (0-4) representing how the student performed. Permissible values are:
“4”,“3”,“2”,“1”,“0”

- __Title__: (String, Required)  A short textual description of what a performance for a given evaluation score entails. This is column B (“Performance/Completion of Competency”) in the “Evaluation Scale” tab of the Google Doc.

- __Frequency__: (String, Required)  A textual description of how frequently this skill was demonstrated. This is column C (“Frequency”) in the “Evaluation Scale” tab of the Google Doc.

- __Support__: (String, Required)  A textual description of what support was needed when this skill was demonstrated. This is column D (“Support or prompt needed”) in the “Evaluation Scale” tab of the Google Doc.

- __Explanation__: (String, Required)  
A more detailed textual description of what a performance for a given evaluation score entails. This is column E (“Explanation”) in the “Evaluation Scale” tab of the Google Doc.

### Adding an Evaluation Scale Score

You can add an evaluation scale score by sending a POST request to the following address: <endpoint_url>/evaluationScale. In the body of the request there should be a JSON block of the following format. All parameters specified as required above must be filled out in this request.
```json
{
  "EvaluationScore": "4",
	 "Title": "Does it well / Has Mastered",
	 "Frequency": "Almost all of the time",
	 "Support": "No support or prompt needed",
	 "Explanation": "Student consistently performs this skill independently and in proper settings. They understand this concept without further assistance or explanation required. Student is aware of the importance of this competency."
}
```
Once a request has been recieved it will give back __Status Code 200__, input the data in our database, and return a JSON block matching the data was entered in the sent body.


### Retrieving all Evaluation Scale Scores
In order to retrieve all of the Evaluation Scale Scores, simply send the GET request to the following address: <endpoint_url>/evaluationScale. This will return a JSON block containing all of the scores that are currently in the system.


When Evaluation Scale Scores are succesfully retrieved the response will have a __Status Code 200__.


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
/evaluationScale
    GET   [Get the evaluation scale]
    POST  [Add a new evaluation scale item]
/tracking-locations-to-competencies
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
        /deactivate
               DELETE [Deactivate the account associated with this id]
    /mentors
        GET    [Get a all users that are mentors]
        /{userId}
           /students
               GET [Get all students associated with the mentor who has the passed in userId]
    /students
        /{userId}
           /mentors
               GET [Get all mentors associated with the student who has the passed in userId]
        GET [Get all users that are students]
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
