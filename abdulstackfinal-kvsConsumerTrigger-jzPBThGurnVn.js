



// table_name	abdulstackcontactDetails
// transcriptionFunction	abdulstackfinal-kvsTranscriber-wdoLTN04NKqY


'use strict';
const AWS = require('aws-sdk');
const lambda = new AWS.Lambda();
var docClient = new AWS.DynamoDB.DocumentClient();

exports.handler = (event, context, callback) => {

    // event.Details.ContactData.ContactId = event.Details.Parameters.CandidateNumber;
    console.log("Received event from Amazon Connect " + JSON.stringify(event));
    
    
    
    // Function to update the dyamoDB with initial customer information
    updateDynamo(event);
    console.log("EVENT:");
    console.log(event);

    let payload = "";

    if (event.eventType) {
        payload ={
            inputFileName: "keepWarm.wav",
            connectContactId: "12b87d2b-keepWarm",
            transcriptionEnabled: "false"
        };
    } else {
        payload = {
            streamARN: event.Details.ContactData.MediaStreams.Customer.Audio.StreamARN,
            startFragmentNum: event.Details.ContactData.MediaStreams.Customer.Audio.StartFragmentNumber,
            connectContactId: event.Details.ContactData.ContactId,
            transcriptionEnabled: event.Details.ContactData.Attributes.transcribeCall === "true" ? true : false,
            saveCallRecording: event.Details.ContactData.Attributes.saveCallRecording === "false" ? false : true,
            languageCode: event.Details.ContactData.Attributes.languageCode === "es-US" ? "es-US" : "en-US",
            // These default to true for backwards compatability purposes
            streamAudioFromCustomer: event.Details.ContactData.Attributes.streamAudioFromCustomer === "false" ? false : true,
            streamAudioToCustomer: event.Details.ContactData.Attributes.streamAudioToCustomer === "false" ? false : true
        };
    }

    console.log("Trigger event passed to transcriberFunction" + JSON.stringify(payload));

    const params = {
        // not passing in a ClientContext
        'FunctionName': process.env.transcriptionFunction,
        // InvocationType is RequestResponse by default
        // LogType is not set so we won't get the last 4K of logs from the invoked function
        // Qualifier is not set so we use $LATEST
        'InvokeArgs': JSON.stringify(payload)
    };

    lambda.invokeAsync(params, function(err, data) {
        if (err) {
            throw (err);
        } else {
            console.log(JSON.stringify(data));
            if (callback)
                callback(null, buildResponse());
            else
                console.log('nothing to callback so letting it go');
        }
    });

    callback(null, buildResponse());
};

function buildResponse() {
    return {
        // we always return "Success" for now
        lambdaResult:"Success"
    };
}

function updateDynamo(event){
    let customerPhoneNumber = event.Details.ContactData.CustomerEndpoint.Address;
    let contactId = event.Details.ContactData.ContactId; 
    let candidateNumber = event.Details.Parameters.CandidateNumber;

    //Sets the timezone environment variable for the Lambda function to east coast. You can change this to your preferred timezone, or remove this line to use UTC
    process.env.TZ = "America/New_York";
    var tableName = process.env.table_name;
    var currentTimeStamp = new Date().toString();
    var currentDate = new Date().toLocaleDateString();

    //set up the database query to be used to update the customer information record in DynamoDB
    var paramsUpdate = {
        TableName: tableName,
        Key: {
            "contactId": contactId
        },

        ExpressionAttributeValues: {
            ":var1": customerPhoneNumber,
            ":var2": currentDate,
            ":var3": currentTimeStamp, 
            ":var4": candidateNumber
        },

        UpdateExpression: "SET customerPhoneNumber = :var1, callDate = :var2, callTimestamp = :var3, candidateNumber = :var4"
    };

    //update the customer record in the database with the new call information using the paramsUpdate query we setup above:
    docClient.update(paramsUpdate, function (err, data) {
        if (err) {
            console.log("Unable to update item. Error: ", JSON.stringify(err, null, 2));
        } else console.log("Updated item succeeded!: ", JSON.stringify(data, null, 2));

    });
}
