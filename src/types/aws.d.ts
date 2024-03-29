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

export type CredentaialsInputType = 'TEXTAREA' | 'FIELDS';

type Profile = {
  name: string;
  id: string;
  credentials: AwsCredentials;
  awsAccountId: string;
};

type ProfileList = {
  [profileId: string]: Profile;
};

type ProfileConfig = {
  currentProfile: Profile | undefined;
  profiles: ProfileList;
};

type Optional<T, K extends keyof T> = Pick<Partial<T>, K> & Omit<T, K>;
