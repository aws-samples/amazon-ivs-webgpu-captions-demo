import { CfnOutput, Stack, StackProps } from "aws-cdk-lib";
import { Construct } from "constructs";
import EnhancedS3Bucket from "./constructs/EnhancedS3Bucket";
import {
  AllowedMethods,
  CachedMethods,
  CachePolicy,
  Distribution,
  HttpVersion,
  OriginAccessIdentity,
  OriginRequestPolicy,
  ResponseHeadersPolicy,
  SecurityPolicyProtocol,
  ViewerProtocolPolicy,
} from "aws-cdk-lib/aws-cloudfront";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { createErrorResponse } from "./utils";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { existsSync } from "fs";
import path from "path";

const BUILD_PATH = path.resolve(__dirname, "../../dist");

class ClientStack extends Stack {
  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const siteBucket = new EnhancedS3Bucket(this, "SiteBucket", {});

    const oai = new OriginAccessIdentity(this, "OAI");
    siteBucket.grantRead(oai);

    const s3Origin = new S3Origin(siteBucket, {
      originAccessIdentity: oai,
    });

    const cacheControlResponseHeadersPolicy = new ResponseHeadersPolicy(
      this,
      "CacheControlHeaders",
      {
        responseHeadersPolicyName: `${this.stackName}-CacheControlHeaders`,
        customHeadersBehavior: {
          customHeaders: [
            {
              header: "Cache-Control",
              value: "no-cache, no-store, must-revalidate",
              override: true,
            },
            { header: "Pragma", value: "no-cache", override: true },
            { header: "Expires", value: "-1", override: true },
          ],
        },
      },
    );

    const distribution = new Distribution(this, "Distribution", {
      defaultBehavior: {
        origin: s3Origin,
        allowedMethods: AllowedMethods.ALLOW_GET_HEAD_OPTIONS,
        cachedMethods: CachedMethods.CACHE_GET_HEAD,
        cachePolicy: CachePolicy.CACHING_OPTIMIZED,
        originRequestPolicy: OriginRequestPolicy.CORS_S3_ORIGIN,
        viewerProtocolPolicy: ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
        responseHeadersPolicy: cacheControlResponseHeadersPolicy,
      },
      enableIpv6: true,
      defaultRootObject: "index.html",
      httpVersion: HttpVersion.HTTP2_AND_3,
      minimumProtocolVersion: SecurityPolicyProtocol.TLS_V1_2_2021,
      errorResponses: [createErrorResponse(403), createErrorResponse(404)],
    });

    new BucketDeployment(this, "BucketDeployment", {
      distribution,
      distributionPaths: ["/*"],
      destinationBucket: siteBucket,
      sources: existsSync(BUILD_PATH) ? [Source.asset(BUILD_PATH)] : [],
    });

    new CfnOutput(this, "distributionDomainName", {
      value: distribution.distributionDomainName,
    });
  }
}

export default ClientStack;
