// import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
// import * as sqs from 'aws-cdk-lib/aws-sqs';

export interface AwsSecretsExtensionProps {
  // Define construct properties here
}

export class AwsSecretsExtension extends Construct {

  constructor(scope: Construct, id: string, props: AwsSecretsExtensionProps = {}) {
    super(scope, id);

    // Define construct contents here

    // example resource
    // const queue = new sqs.Queue(this, 'AwsSecretsExtensionQueue', {
    //   visibilityTimeout: cdk.Duration.seconds(300)
    // });
  }
}
