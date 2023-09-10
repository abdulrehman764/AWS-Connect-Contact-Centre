# AWS-Connect-Contact-Centre

This repository contains an AWS Contact Center Solution developed using various AWS services, including AWS Lambda functions and Amazon Connect Contact Flows. This README provides an overview of the components, Lambda functions, and contact flows included in this solution.

## Table of Contents

- [AWS Connect Contact Center Solution - README](#aws-connect-contact-center-solution---readme)
  - [Table of Contents](#table-of-contents)
  - [Solution Overview](#solution-overview)
  - [Components](#components)
    - [Lambda Functions](#lambda-functions)
      - [1. `abdulstackfinal-overlayaudio-b0R0Tq20ybWV`](#1-abdulstackfinal-overlayaudio-b0r0tq20ybWv)
        - [Configuration](#configuration)
      - [2. `abdulstackfinal-processContactSummary-iOlUoNsHKgeG`](#2-abdulstackfinal-processcontactsummary-ioluoNSHKgeG)
        - [Configuration](#configuration-1)
      - [3. `talentOverflowFetchCandidate`](#3-talentoverflowfetchcandidate)
        - [Configuration](#configuration-2)
      - [4. `abdulstackfinal-kvsConsumerTrigger-jzPBThGurnVn`](#4-abdulstackfinal-kvsconsumertrigger-jzpBThGurnVn)
        - [Configuration](#configuration-3)
      - [5. `VerifyCandidateNumber`](#5-verifycandidatenumber)
        - [Configuration](#configuration-4)
      - [6. `abdulstackfinal-kvsTranscriber-wdoLTN04NKqY`](#6-abdulstackfinal-kvstranscriber-wdoltn04nkqy)
        - [Configuration](#configuration-5)
    - [Amazon Connect Contact Flows](#amazon-connect-contact-flows)
  - [Getting Started](#getting-started)
  - [Contributing](#contributing)
  - [License](#license)

## Solution Overview

This AWS Contact Center Solution is designed to handle audio recording files and perform various operations on them. The solution involves Lambda functions for audio processing, transcription, and merging, as well as Amazon Connect Contact Flows for call routing and interaction handling.

The primary components of this solution include:

1. **Lambda Functions**: These serverless functions perform various tasks related to audio processing, transcription, and DynamoDB updates.

2. **Amazon Connect Contact Flows**: These define the call flow logic, including routing, prompts, and invoking Lambda functions.

## Components

### Lambda Functions

#### 1. `abdulstackfinal-overlayaudio-b0R0Tq20ybWV`

- **Description**: AWS Lambda Function that merges two audio files from an S3 bucket and stores the merged audio file in a different S3 bucket.

- **Package Type**: Zip

- **Runtime**: Python 3.8

##### Configuration

- **Trigger**: This Lambda function should be triggered when a new audio file needs to be merged.

- **Environment Variables**:
  - `contactDetailsTableName`: The name of the DynamoDB table containing contact details.

#### 2. `abdulstackfinal-processContactSummary-iOlUoNsHKgeG`

- **Description**: AWS Lambda Function that processes call recordings, collects transcript segments, and updates a contact database.

- **Package Type**: Zip

- **Runtime**: Node.js 14.x

##### Configuration

- **Trigger**: This Lambda function should be triggered when a new WAV call recording file is placed in an S3 bucket.

- **Environment Variables**:
  - `transcript_seg_table_name`: The name of the DynamoDB table for transcript segments.
  - `transcript_seg_to_customer_table_name`: The name of the DynamoDB table for customer transcript segments.
  - `contact_table_name`: The name of the DynamoDB table for contact details.
  - `combined_audio_bucket`: The name of the S3 bucket where combined audio files will be stored.
  - `merge_audio_lambda`: The name or ARN of the Lambda function responsible for merging audio files.

#### 3. `talentOverflowFetchCandidate`

- **Description**: Lambda function (purpose not specified).

- **Package Type**: Zip

- **Runtime**: Ruby 3.2

##### Configuration

- Configuration details for this function are not provided.

#### 4. `abdulstackfinal-kvsConsumerTrigger-jzPBThGurnVn`

- **Description**: AWS Lambda Function to start (asynchronous) streaming transcription; it is expected to be called by the Amazon Connect Contact Flow.

- **Package Type**: Zip

- **Runtime**: Node.js 14.x

##### Configuration

- **Trigger**: This Lambda function should be triggered by an Amazon Connect Contact Flow.

- **Environment Variables**: Not specified.

#### 5. `VerifyCandidateNumber`

- **Description**: Lambda function (purpose not specified).

- **Package Type**: Zip

- **Runtime**: Python 3.11

##### Configuration

- Configuration details for this function are not provided.

#### 6. `abdulstackfinal-kvsTranscriber-wdoLTN04NKqY`

- **Description**: Processes audio from Kinesis Video Stream and uses Amazon Transcribe to get text for the caller audio. It is invoked by the `kvsConsumerTrigger` Lambda, writes results to the transcript DynamoDB tables, and uploads the audio file to S3.

- **Package Type**: Zip

- **Runtime**: Java 8 on Amazon Linux 1

##### Configuration

- **Trigger**: This Lambda function should be invoked by the `kvsConsumerTrigger` Lambda function.

- **Environment Variables**: Not specified.

### Amazon Connect Contact Flows

The repository may contain Amazon Connect Contact Flows that define call routing and interaction handling. These flows integrate with Lambda functions to provide a seamless call experience.

## Getting Started

To set up and deploy this AWS Contact Center Solution, follow the instructions provided in the respective components' README files and documentation. Ensure that you have the necessary AWS credentials and permissions to create and manage AWS resources.

## Contributing

Contributions to this repository are welcome. Please follow the standard GitHub workflow for contributing to open-source projects, including creating pull requests, providing detailed descriptions, and adhering to coding standards.

## License

This AWS Contact Center Solution is provided under the [LICENSE NAME HERE] license. See the [LICENSE](LICENSE) file for details.
