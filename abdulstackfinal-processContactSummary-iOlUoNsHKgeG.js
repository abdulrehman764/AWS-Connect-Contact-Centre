
// METRICS	true
// combined_audio_bucket	abdul1-new-combined-audio-bucket-name
// contact_table_name	abdulstackcontactDetails
// merge_audio_lambda	abdulstackfinal-overlayaudio-b0R0Tq20ybWV
// transcript_seg_table_name	abdulstackcontactTranscriptSegments
// transcript_seg_to_customer_table_name	abdulstackcontactTranscriptSegmentsToCustomer



'use strict';

console.log('Loading function');

const aws = require('aws-sdk');
const url = require("url");
const path = require("path");
const transcript_seg_table_name = process.env.transcript_seg_table_name;
const transcript_seg_to_customer_table_name = process.env.transcript_seg_to_customer_table_name;
const contact_table_name = process.env.contact_table_name;

const combinedBucket = process.env.combined_audio_bucket;
const lambdaFunc = process.env.merge_audio_lambda;

// S3 to check the two audio files
var s3bucket = new aws.S3();


exports.handler = (event, context, callback) => {
    console.log('Received event::', JSON.stringify(event, null, 2));

    // Get the object from the event and show its content type
    const bucket = event.Records[0].s3.bucket.name;
    const key = decodeURIComponent(event.Records[0].s3.object.key.replace(/\+/g, ' '));

    // set the download URL
    let recordingURL = `https://${bucket}.s3.amazonaws.com/${key}`;

    //get file name ie: ContactID
    var parsed = url.parse(recordingURL);
    var file = path.basename(parsed.pathname);
    var contactId = file.split('_')[0];
    console.log(`Received event for this contact ID: ${contactId}`);

    //Determine if File is AUDIO_FROM_CUSTOMER or TO_CUSTOMER
    let strAudioFromCustomer = "AUDIO_FROM_CUSTOMER";
    let strAudioToCustomer = "AUDIO_TO_CUSTOMER";

    let audioFromCustomer = key.includes(strAudioFromCustomer);
    let audioToCustomer = key.includes(strAudioToCustomer);
    
    if (audioFromCustomer){
        console.log("GOT AUDIO FROM CUSTOMER");
    }
    if (audioToCustomer){
        console.log("GOT AUDIO TO CUSTOMER");
    } 

    //Call Function to Combine Audio
    combineAudio( bucket,contactId,lambdaFunc, combinedBucket );

    getTranscript(contactId, transcript_seg_table_name)
        .then(result1 => {
            getTranscript(contactId, transcript_seg_to_customer_table_name)
            .then(result2 => {
                var contactTranscriptFromCustomer = result1;
                var contactTranscriptToCustomer = result2;
                //Checking if audioFromCustomer and setting up parameters for DynamoDB update 
                if (audioFromCustomer){
                //set up the database query to be used to update the customer information record in DynamoDB
                var paramsUpdate = {
                    TableName: contact_table_name,
                    Key: {
                        "contactId": contactId
                    },
                    
                    ExpressionAttributeValues: {
                        ":var1": contactTranscriptFromCustomer,
                        ":var2": recordingURL
                    },
                    //Updating audioFromCustomer field in DynamoDB with recording URL
                    UpdateExpression: "SET contactTranscriptFromCustomer = :var1, audioFromCustomer = :var2"
                };
            //Checking if audioToCustomer and setting up parameters for DynamoDB update 
            } else if (audioToCustomer) {
                //set up the database query to be used to update the customer information record in DynamoDB
                var paramsUpdate = {
                    TableName: contact_table_name,
                    Key: {
                        "contactId": contactId
                    },
                     
                    ExpressionAttributeValues: {
                        ":var1": contactTranscriptToCustomer,
                        ":var2": recordingURL
                    },
                    //Updating audioToCustomer field in DynamoDB with recording URL
                    UpdateExpression: "SET contactTranscriptToCustomer = :var1, audioToCustomer = :var2"
                };
                
                }

                //update the customer record in the database with the new call information using the paramsUpdate query we setup above:
                var docClient = new aws.DynamoDB.DocumentClient();
                docClient.update(paramsUpdate, function (err, data) {
                    if (err) {
                        console.log("Unable to update item. Error: ", JSON.stringify(err, null, 2));
                    } else {
                        console.log("Updated item succeeded: ", JSON.stringify(data, null, 2));
                    }

                });
                callback(null, "Success!");
            });
        });

};
function uploadTranscriptToS3(contactId, transcriptContent) {
    var paramsQuery1 = {
            TableName: contact_table_name,
            KeyConditionExpression: "contactId = :varContactId",

            ExpressionAttributeValues: {
                ":varContactId": contactId
            }
        };
    var docClient = new aws.DynamoDB.DocumentClient();
    var callTimestamp;
    var candidateNumber;
    docClient.query(paramsQuery1, (err, dbResults) => {
            //check to make sure the query executed correctly, if so continue, if not error out the lambda function
            if (err) {
                console.log(err);
                // reject();
            }
            //if no error occured, proceed to process the results that came back from DynamoDB
            else {
                //log the results from the DynamoDB querydb
                console.log("ABDUL TEXT TEST1 TET FINAL !1 on uploading")
                console.log(dbResults)
                var transcript = "";
                var results = dbResults.Items;
                console.log(dbResults)
                var item = results[0];
                callTimestamp = item.callTimestamp;
                candidateNumber = item.candidateNumber;
      
      // You can use callTimestamp and candidateNumber here or store them for later use
                console.log("Call Timestamp: " + callTimestamp);
                console.log("Candidate Number: " + candidateNumber);
                const transcriptFileName =  `${candidateNumber}_${callTimestamp}.txt`;
    // Specify the S3 bucket and key for the transcript file
                const transcriptBucket = 'abdul1-new-combined-audio-bucket-name';
                const transcriptKey = `${transcriptFileName}`;
            
                // Create an S3 instance
                const s3 = new aws.S3();
            
                // Set up parameters for uploading the transcript text file
                const uploadParams = {
                    Bucket: transcriptBucket,
                    Key: transcriptKey,
                    Body: transcriptContent, // Set the transcript content as the Body of the text file
                    ContentType: 'text/plain', // Specify the content type as text/plain
                };
            
                // Upload the transcript text file to the specified S3 bucket
                s3.upload(uploadParams, (err, data) => {
                    if (err) {
                        console.error(`Error uploading transcript: ${err}`);
                    } else {
                        console.log(`Transcript uploaded to S3: ${transcriptKey}`);
                    }
                });

                // for (var i = 0; i <= results.length - 1; i++) {
                //     transcript += results[i].Transcript + " ";
                // }

                // if (transcript) {
                //     transcript = transcript;
                //     uploadTranscriptToS3(contactId, transcript);
                    
                // } else transcript = "Transcript not available for this call";

                // console.log("table (" + tableName +") has the transcript: " + transcript);
                // // Upload the transcript as a text file to S3
                
                // resolve(transcript);

            }
 
        });
    
    console.log("IN UPLOAD FUCN");
    console.log("Transcript is before me ");
    console.log(transcriptContent);
    console.log("Call Timestamp: " + callTimestamp);
    console.log("Candidate Number: " + candidateNumber);

    // Create a unique file name for the transcript text file
    
   
    
    // const transcriptFileName =  `${candidateNumber}_${callTimestamp}.txt`;
    // // Specify the S3 bucket and key for the transcript file
    // const transcriptBucket = 'abdul1-new-audio-bucket-name';
    // const transcriptKey = `recordings/${transcriptFileName}`;

    // // Create an S3 instance
    // const s3 = new aws.S3();

    // // Set up parameters for uploading the transcript text file
    // const uploadParams = {
    //     Bucket: transcriptBucket,
    //     Key: transcriptKey,
    //     Body: transcriptContent, // Set the transcript content as the Body of the text file
    //     ContentType: 'text/plain', // Specify the content type as text/plain
    // };

    // // Upload the transcript text file to the specified S3 bucket
    // s3.upload(uploadParams, (err, data) => {
    //     if (err) {
    //         console.error(`Error uploading transcript: ${err}`);
    //     } else {
    //         console.log(`Transcript uploaded to S3: ${transcriptKey}`);
    //     }
    // });
}
function getTranscript(contactId, tableName) {
    return new Promise(function (resolve, reject) {
        var docClient = new aws.DynamoDB.DocumentClient();
        

        //set up the database query to be used to lookup customer information from DynamoDB
        var paramsQuery = {
            TableName: tableName,
            KeyConditionExpression: "ContactId = :varContactId",

            ExpressionAttributeValues: {
                ":varContactId": contactId
            }
        };

        console.log("querying ddb with1: " + JSON.stringify(paramsQuery));
        

        console.log("ORIGNAL QUERY TO ")

        //use the lookup query (paramsQuery) we set up to lookup the contact transcript segments from DynamoDB
        docClient.query(paramsQuery, (err, dbResults) => {
            //check to make sure the query executed correctly, if so continue, if not error out the lambda function
            if (err) {
                console.log(err);
                reject();
            }
            //if no error occured, proceed to process the results that came back from DynamoDB
            else {
                //log the results from the DynamoDB querydb
                console.log("ABDUL TEXT TEST TET")
                console.log(dbResults)
                var transcript = "";
                var results = dbResults.Items;

                for (var i = 0; i <= results.length - 1; i++) {
                    transcript += results[i].Transcript + " ";
                }

                if (transcript) {
                    transcript = transcript;
                    uploadTranscriptToS3(contactId, transcript);
                    
                } else transcript = "Transcript not available for this call";

                console.log("table (" + tableName +") has the transcript: " + transcript);
                // Upload the transcript as a text file to S3
                
                resolve(transcript);

            }

        });
    });
}

// ---------------------------------------------------------------------------

function combineAudio(bucketName, contactIdent, lambdaFunc, combinedBucket)
{
    console.log("INSIDE COMBINE AUDIO FUNC")
            var paramsQuery1 = {
            TableName: contact_table_name,
            KeyConditionExpression: "contactId = :varContactId",

            ExpressionAttributeValues: {
                ":varContactId": contactIdent
            }
        };
    var docClient = new aws.DynamoDB.DocumentClient();
    var callTimestamp;
    var candidateNumber;
    docClient.query(paramsQuery1, (err, dbResults) => {
            //check to make sure the query executed correctly, if so continue, if not error out the lambda function
            if (err) {
                console.log(err);
                // reject();
            }
            //if no error occured, proceed to process the results that came back from DynamoDB
            else {
                //log the results from the DynamoDB querydb
                console.log("ABDUL TEXT TEST1 TET FINAL !1 on uploading")
                console.log(dbResults)
                var transcript = "";
                var results = dbResults.Items;
                console.log(dbResults)
                var item = results[0];
                callTimestamp = item.callTimestamp;
                candidateNumber = item.candidateNumber;
      
      // You can use callTimestamp and candidateNumber here or store them for later use
                console.log("Call Timestamp: " + callTimestamp);
                console.log("Candidate Number: " + candidateNumber);
                const transcriptFileName =  `${candidateNumber}_${callTimestamp}`;
    // Specify the S3 bucket and key for the transcript file
                const transcriptBucket = 'abdul1-new-audio-bucket-name';
                const transcriptKey = `recordings/${transcriptFileName}`;
                
                
                console.log("Caliing the lambda")
                const lambda = new aws.Lambda();
                var bucketParams = {
                	Bucket: bucketName,
                	Delimiter: '/',
                	Prefix: 'recordings/' + contactIdent
                };
        
            
        
                // List files in starting with a specific Contact ID
                s3bucket.listObjects(bucketParams, function (err, data){
                    if (err) {console.log(err,err.stack);}
                    else {
                        // Loop thru to find the To and From files
                        for (let index = 0; index < data['Contents'].length; index++)
                        {
                            console.log("INSIDE S$ list combineAudio")
                    		console.log(data['Contents'][index]['Key']);
                            var filename = data['Contents'][index]['Key'];
                            if (filename.includes('TO')) {
                                var fileTo = filename;
                            }
                            if (filename.includes('FROM')){
                                    var fileFrom = filename;
                            }
                    	}
                    	// if both files are found proceed to call the merge audio streams
                        if (fileFrom || fileTo) {
                            console.log("Got both files invoke Lambda");
                            var dates = new Date();
                            var datesString = dates.toISOString();
                            var lambdaParams = {
                                FunctionName: lambdaFunc,
                                InvocationType: "Event",
                                Payload:JSON.stringify({
                                    "sources": [{
                                        "Bucket": bucketName,
                                        "Key": fileFrom
                                    },
                                    {
                                        "Bucket" : bucketName,
                                        "Key" : fileTo
                                    }],
                                    "target": {
                                        "Bucket": combinedBucket,
                                        "Key": contactIdent + "_" +datesString + "_COMBINED_AUDIO.wav"
                                    }
                                })
                            };
                            console.log("LAMBDA PARAMS ARE: ")
                            console.log(lambdaParams);
                            // Invoke merge audio files
                            lambda.invoke(lambdaParams, function(error, data){
                                    console.log("error value in lambda" + error);
                                    if (error) {console.log("Error invoking Lambda");}
                                        else { console.log("DATA RETURNED BY LAMBDA")
                                            console.log(data);}
                            });
                        }
                        else {
                            // If just one file is found, wait for the other file.
                            console.log("Waiting for the other file");
                        }
                    }
            });
            
                // // Create an S3 instance
                // const s3 = new aws.S3();
            
                // // Set up parameters for uploading the transcript text file
                // const uploadParams = {
                //     Bucket: transcriptBucket,
                //     Key: transcriptKey,
                //     Body: transcriptContent, // Set the transcript content as the Body of the text file
                //     ContentType: 'text/plain', // Specify the content type as text/plain
                // };
            
                // // Upload the transcript text file to the specified S3 bucket
                // s3.upload(uploadParams, (err, data) => {
                //     if (err) {
                //         console.error(`Error uploading transcript: ${err}`);
                //     } else {
                //         console.log(`Transcript uploaded to S3: ${transcriptKey}`);
                //     }
                // });

                // for (var i = 0; i <= results.length - 1; i++) {
                //     transcript += results[i].Transcript + " ";
                // }

                // if (transcript) {
                //     transcript = transcript;
                //     uploadTranscriptToS3(contactId, transcript);
                    
                // } else transcript = "Transcript not available for this call";

                // console.log("table (" + tableName +") has the transcript: " + transcript);
                // // Upload the transcript as a text file to S3
                
                // resolve(transcript);

            }
 
        });
    

    //     const lambda = new aws.Lambda();
    //     var bucketParams = {
    //     	Bucket: bucketName,
    //     	Delimiter: '/',
    //     	Prefix: 'recordings/' + contactIdent
    //     };

    
        
    //     // List files in starting with a specific Contact ID
    //     s3bucket.listObjects(bucketParams, function (err, data){
    //         if (err) {console.log(err,err.stack);}
    //         else {
    //             // Loop thru to find the To and From files
    //             for (let index = 0; index < data['Contents'].length; index++)
    //             {
    //         		//console.log(data['Contents'][index]['Key']);
    //                 var filename = data['Contents'][index]['Key'];
    //                 if (filename.includes('TO')) {
    //                     var fileTo = filename;
    //                 }
    //                 if (filename.includes('FROM')){
    //                         var fileFrom = filename;
    //                 }
    //         	}
    //         	// if both files are found proceed to call the merge audio streams
    //             if ( fileTo && fileFrom) {
    //                 console.log("Got both files invoke Lambda");
    //                 var dates = new Date();
    //                 var datesString = dates.toISOString();
    //                 var lambdaParams = {
    //                     FunctionName: lambdaFunc,
    //                     InvocationType: "Event",
    //                     Payload:JSON.stringify({
    //                         "sources": [{
    //                             "Bucket": bucketName,
    //                             "Key": fileTo
    //                         },
    //                         {
    //                             "Bucket": bucketName,
    //                             "Key": fileFrom
    //                         }],
    //                         "target": {
    //                             "Bucket": combinedBucket,
    //                             "Key": contactIdent + "_" + datesString + "_COMBINED_AUDIO.wav"
    //                         }
    //                     })
    //                 };
    //                 console.log(lambdaParams);
    //                 // Invoke merge audio files
    //                 lambda.invoke(lambdaParams, function(error, data){
    //                         console.log("error value" + error);
    //                         if (error) {console.log("Error invoking Lambda");}
    //                             else {console.log(data);}
    //                 });
    //             }
    //             else {
    //                 // If just one file is found, wait for the other file.
    //                 console.log("Waiting for the other file");
    //             }
    //         }
    // });
}
