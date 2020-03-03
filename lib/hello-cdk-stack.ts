import core = require("@aws-cdk/core");
import s3 = require("@aws-cdk/aws-s3");
import apigateway = require("@aws-cdk/aws-apigateway");
import dynamodb = require("@aws-cdk/aws-dynamodb");
import lambda = require("@aws-cdk/aws-lambda");
import { Rule, Schedule } from '@aws-cdk/aws-events';
import { LambdaFunction } from '@aws-cdk/aws-events-targets';
import iam = require('@aws-cdk/aws-iam');

export class HelloCdkStack extends core.Stack {
  constructor(app: core.App, id: string, props?: core.StackProps) {
    super(app, id, props);

    // const s3Bucket = new s3.Bucket(this, "myBucket", {
    //   versioned: true,
    //   bucketName: "mybucket"
    // });

    const dynamoTable = new dynamodb.Table(this, "items", {
      partitionKey: {
        name: "itemId",
        type: dynamodb.AttributeType.STRING
      },
      tableName: "items",

      // The default removal policy is RETAIN, which means that cdk destroy will not attempt to delete
      // the new table, and it will remain in your account until manually deleted. By setting the policy to
      // DESTROY, cdk destroy will delete the table (even if it has data in it)
      removalPolicy: core.RemovalPolicy.DESTROY // NOT recommended for production code
    });

    const getOneLambda = new lambda.Function(this, "getOneItemFunction", {
      code: new lambda.AssetCode("lib/lambdas"),
      handler: "get-one.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: "itemId"
      }
    });

    const getAllLambda = new lambda.Function(this, "getAllItemsFunction", {
      code: new lambda.AssetCode("lib/lambdas"),
      handler: "get-all.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: "itemId"
      }
    });

    const createOne = new lambda.Function(this, "createItemFunction", {
      // code: new lambda.AssetCode("/Users/xuyitu/projects/poc/hello-cdk"),
      code: new lambda.AssetCode("lib/lambdas"),
      handler: "create.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: "itemId"
      }
    });

    const updateOne = new lambda.Function(this, "updateItemFunction", {
      code: new lambda.AssetCode("lib/lambdas"),
      handler: "update-one.handler",
      runtime: lambda.Runtime.NODEJS_12_X,
      environment: {
        TABLE_NAME: dynamoTable.tableName,
        PRIMARY_KEY: "itemId"
      }
    });

    const deleteOne = new lambda.Function(this, "deleteItemFunction", {
      code: new lambda.AssetCode("lib/lambdas"),
      handler: "delete-one.handler",
      runtime: lambda.Runtime.NODEJS_12_X
    });

    const cronJobFn = new lambda.Function(this, "cronJobFunction", {
      code: new lambda.AssetCode("lib/lambdas"),
      handler: "cronjob.handler",
      runtime: lambda.Runtime.NODEJS_12_X,  
    });

    //Define the IAM role
    const cronJobFnRole = new iam.Role(this, 'cronJobFnRole', {
        assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com')
    });

    cronJobFnRole.addToPolicy(new iam.PolicyStatement({
        resources: [
            '*'
        ],
        actions: [
            'logs:CreateLogGroup',
            'logs:CreateLogStream',
            'logs:DescribeLogGroups',
            'logs:DescribeLogStreams',
            'logs:PutLogEvents',
            'logs:GetLogEvents',
            'logs:FilterLogEvents'
        ]
    }));    

    // Run every day at 6PM UTC
    // See https://docs.aws.amazon.com/lambda/latest/dg/tutorial-scheduled-events-schedule-expressions.html
    const rule = new Rule(this, 'ScheduleRule', {
      schedule: Schedule.cron({minute: "1", hour: "0"})
      // this is what we want, every 15 minutes. 
      // schedule: Schedule.cron({minute: "0/15"}) 
    });

    rule.addTarget(new LambdaFunction(cronJobFn));

    dynamoTable.grantReadWriteData(getAllLambda);
    dynamoTable.grantReadWriteData(getOneLambda);
    dynamoTable.grantReadWriteData(createOne);
    dynamoTable.grantReadWriteData(updateOne);
    dynamoTable.grantReadWriteData(deleteOne);

    const api = new apigateway.RestApi(this, "itemsApi", {
      restApiName: "Items Service"
    });

    const items = api.root.addResource("items");
    const getAllIntegration = new apigateway.LambdaIntegration(getAllLambda);
    items.addMethod("GET", getAllIntegration);

    const createOneIntegration = new apigateway.LambdaIntegration(createOne);
    items.addMethod("POST", createOneIntegration);
    addCorsOptions(items);

    const singleItem = items.addResource("{id}");
    const getOneIntegration = new apigateway.LambdaIntegration(getOneLambda);
    singleItem.addMethod("GET", getOneIntegration);

    const updateOneIntegration = new apigateway.LambdaIntegration(updateOne);
    singleItem.addMethod("PATCH", updateOneIntegration);

    const deleteOneIntegration = new apigateway.LambdaIntegration(deleteOne);
    singleItem.addMethod("DELETE", deleteOneIntegration);
    addCorsOptions(singleItem);
  }
}

export function addCorsOptions(apiResource: apigateway.IResource) {
  apiResource.addMethod(
    "OPTIONS",
    new apigateway.MockIntegration({
      integrationResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers":
              "'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token,X-Amz-User-Agent'",
            "method.response.header.Access-Control-Allow-Origin": "'*'",
            "method.response.header.Access-Control-Allow-Credentials":
              "'false'",
            "method.response.header.Access-Control-Allow-Methods":
              "'OPTIONS,GET,PUT,POST,DELETE'"
          }
        }
      ],
      passthroughBehavior: apigateway.PassthroughBehavior.NEVER,
      requestTemplates: {
        "application/json": '{"statusCode": 200}'
      }
    }),
    {
      methodResponses: [
        {
          statusCode: "200",
          responseParameters: {
            "method.response.header.Access-Control-Allow-Headers": true,
            "method.response.header.Access-Control-Allow-Methods": true,
            "method.response.header.Access-Control-Allow-Credentials": true,
            "method.response.header.Access-Control-Allow-Origin": true
          }
        }
      ]
    }
  );
}

const app = new core.App();
new HelloCdkStack(app, "HelloCdkStack", {});
app.synth();
