export type AwsCredentials = {
  accessKeyId: string;
  secretAccessKey: string;
  sessionToken: string;
}

export type AwsQueue = {
  url: string;
  name: string;
  accountNumber: string;
}

export type NewSqsMessageAttribute = {
  name: string;
  type: 'string' | 'number';
  value: string | number;
  id: string;
}

export type NewSqsMessage = {
  body: string;
  messageAttributes: NewSqsMessageAttribute[];
  delaySeconds: number;
}
