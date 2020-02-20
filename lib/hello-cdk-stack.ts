import core = require("@aws-cdk/core");
import s3 = require("@aws-cdk/aws-s3");

export class HelloCdkStack extends core.Stack {
  constructor(scope: core.App, id: string, props?: core.StackProps) {
    super(scope, id, props);

    new s3.Bucket(this, "MyFirstBucket", {
      versioned: true
    });
  }
}
