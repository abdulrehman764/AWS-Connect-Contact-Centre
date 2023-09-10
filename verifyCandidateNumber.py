import json
# if they type 123456 -- correct code
# anything else is incorrect


def lambda_handler(event, context):
    # TODO implement
    print(f"event is: {event}")
    CandidateNumber = event['Details']['Parameters']['CandidateNumber']
    print(f"Candidate Number from Customer: {CandidateNumber}")
    if CandidateNumber == "123456":
        print("True Returned")
        return {"Status" : "True" }
    else:
        print("False Returned")
        return {"Status" : "False" }
