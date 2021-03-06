# Welcome to your CDK TypeScript project!

This is a blank project for TypeScript development with CDK.

The `cdk.json` file tells the CDK Toolkit how to execute your app.

## Useful commands

- `npm run build` compile typescript to js
- `npm run watch` watch for changes and compile
- `npm run test` perform the jest unit tests
- `cdk deploy` deploy this stack to your default AWS account/region
- `cdk diff` compare deployed stack with current state
- `cdk synth` emits the synthesized CloudFormation template

## Build

To build this app, you need to be in this example's root folder. Then run the following:

```bash
npm install -g aws-cdk
npm install
npm run build
```

## Deploy

Run `cdk deploy`. This will deploy / redeploy your Stack to your AWS Account.

After the deployment you will see the API's URL, which represents the url you can then use.

## The Component Structure

The whole component contains:

- An API, with CORS enabled on all HTTTP Methods. (Use with caution, for production apps you will want to enable only a certain domain origin to be able to query your API.)
- Lambda pointing to `lambdas/create.ts`, containing code for **storing** an item into the DynamoDB table.
- Lambda pointing to `lambdas/delete-one.ts`, containing code for **deleting** an item from the DynamoDB table.
- Lambda pointing to `lambdas/get-all.ts`, containing code for **getting all items** from the DynamoDB table.
- Lambda pointing to `lambdas/get-one.ts`, containing code for **getting an item** from the DynamoDB table.
- Lambda pointing to `lambdas/update-one.ts`, containing code for **updating an item** in the DynamoDB table.
- A DynamoDB table `items` that stores the data.
- Five `LambdaIntegrations` that connect these Lambdas to the API.

## More complicated lambda:

https://stackoverflow.com/questions/57674293/lambda-cant-find-modules-from-outer-folders-when-deployed-with-cdk
https://github.com/aws-samples/aws-cdk-examples/issues/110

- Solution1:

├── bin
│ └── lambda.ts
├── cdk.json
├── cdk.out
│ ├── LambdaStack.template.json
│ ├── asset.lotsOfLetters
│ │ ├── basic.js
│ │ ├── node_modules # Node modules found here
│ │ ├── package-lock.json
│ │ └── package.json
│ ├── cdk.out
│ ├── manifest.json
│ └── tree.json
├── lib
│ └── lambda-stack.ts
├── package-lock.json
├── package.json
├── src
│ ├── basic.js
│ ├── node_modules # this is inside the src, (in addition to the root one required to build)
│ ├── package-lock.json
│ └── package.json

- Solution2:
  zip -r lambdas.zip src/_ node_modules/_

const myLambda = new lambda.Function(this, 'iHaveNodeModules', {
code: lambda.Code.fromAsset('lambdas.zip'),
handler: 'src.basic.handler',
runtime: lambda.Runtime.NODEJS_10_X
})
