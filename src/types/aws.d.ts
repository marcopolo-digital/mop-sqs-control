export type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
};

export type AwsQueue = {
  url: string;
  name: string;
  accountNumber: string;
  attributes: AwsQueueAttributes;
};
type JSONString = string;
export type AwsQueueAttributes = {
  ApproximateNumberOfMessages: string;
  ApproximateNumberOfMessagesDelayed: string;
  ApproximateNumberOfMessagesNotVisible: string;
  CreatedTimestamp: string;
  DelaySeconds: string;
  LastModifiedTimestamp: string;
  MaximumMessageSize: string;
  MessageRetentionPeriod: string;
  Policy: string;
  QueueArn: string;
  ReceiveMessageWaitTimeSeconds: string;
  RedrivePolicy: JSONString;
  VisibilityTimeout: string;
};

export type NewSqsMessageAttribute = {
  name: string;
  type: 'string' | 'number';
  value: string | number;
  id: string;
};

export type NewSqsMessage = {
  body: string;
  messageAttributes: NewSqsMessageAttribute[];
  delaySeconds: number;
};
