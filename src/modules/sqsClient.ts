/* eslint-disable no-unused-expressions */
/* eslint-disable id-length */
import type { AwsQueue, AwsQueueAttributes, NewSqsMessage } from '@/types/aws';
import type { Message } from '@aws-sdk/client-sqs';
import {
	DeleteMessageBatchCommand, SendMessageBatchCommand, GetQueueAttributesCommand, SQSClient, ListQueuesCommand,
	ReceiveMessageCommand, PurgeQueueCommand, DeleteMessageCommand, SendMessageCommand
} from '@aws-sdk/client-sqs';
import { ref } from '@vue/composition-api';
import { globalProfileConfigRef } from '../modules/profiles';
import { currentRegionRef } from '../modules/awsConfig';

export const selectedQueueUrl = ref<string | null>(null);
export const sqsQueues = ref<AwsQueue[]>([]);
export const isLoadingQueues = ref<boolean>(true);

function getSqsClient(): SQSClient {
	return new SQSClient({
		region: currentRegionRef.value,
		credentials: globalProfileConfigRef.value?.currentProfile?.credentials
	});
}

export async function refreshQueues(): Promise<void> {
	console.log('refreshQueues');

	isLoadingQueues.value = true;
	sqsQueues.value = await getQueues();
	if (
		!sqsQueues.value.find((queue) => queue.url === selectedQueueUrl.value)
	) {
		selectedQueueUrl.value = null;
	}
	isLoadingQueues.value = false;
}

export async function getQueues(): Promise<AwsQueue[]> {
	const client = getSqsClient();
	const command = new ListQueuesCommand({});

	try {
		const queuesResponse = await client.send(command);

		if (!queuesResponse.QueueUrls) {
			return [];
		}

		return Promise.all(queuesResponse.QueueUrls.map(async (queueUrl): Promise<AwsQueue> => {
			const queueParts = queueUrl.split('/');

			return {
				url: queueUrl,
				accountNumber: queueParts[3],
				name: queueParts[4],
				attributes: await getQueueAttributes(queueUrl)
			};
		}));
	} catch (error) {
		errorHandler(error);
		return [];
	}
}

export async function pollMessages(queueUrl: string, durationSeconds: number): Promise<Message[]> {
	const stopDate = new Date();
	stopDate.setSeconds(stopDate.getSeconds() + Number(durationSeconds));

	const receiptHandles: string[] = [];
	const messages: Message[] = [];
	do {
		const newMessages = await getMessages(queueUrl);
		newMessages.forEach((message) => {
			if (!receiptHandles.includes(message.ReceiptHandle as string)) {
				messages.push(message);
			}
		});
	} while (new Date() < stopDate);
	return messages;
}

export async function getMessages(queueUrl: string): Promise<Message[]> {
	if (!queueUrl) {
		return [];
	}
	const client = getSqsClient();
	const command = new ReceiveMessageCommand({
		QueueUrl: queueUrl,
		MaxNumberOfMessages: 10,
		WaitTimeSeconds: 2,
		MessageAttributeNames: ['All'],
		AttributeNames: ['All']
	});

	try {
		const messagesResponse = await client.send(command);
		if (!messagesResponse.Messages) {
			return [];
		}

		return messagesResponse.Messages;
	} catch (error) {
		errorHandler(error);
		return [];
	}
}

export async function purgeQueue(queueUrl: string): Promise<void> {
	const client = getSqsClient();
	const command = new PurgeQueueCommand({
		QueueUrl: queueUrl
	});
	try {
		await client.send(command);
	} catch (error) {
		errorHandler(error);
	}
}

export async function deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
	const client = getSqsClient();
	const command = new DeleteMessageCommand({
		QueueUrl: queueUrl,
		ReceiptHandle: receiptHandle
	});
	try {
		await client.send(command);
	} catch (error) {
		errorHandler(error);
	}
}

export async function createMessage(queueUrl: string, message: NewSqsMessage): Promise<void> {
	const client = getSqsClient();
	const command = new SendMessageCommand({
		QueueUrl: queueUrl,
		DelaySeconds: message.delaySeconds,
		MessageBody: message.body,
		MessageAttributes: message.messageAttributes.reduce((result, message) => {
			result[message.name] = {
				DataType: message.type === 'number' ? 'Number' : 'String',
				StringValue: message.value
			};
			return result;
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		}, {} as any)
	});
	try {
		await client.send(command);
	} catch (error) {
		errorHandler(error);
	}
}

export async function moveMessage(sourceQueueUrl: string, destinationQueueUrl: string, sourceMessage: Message): Promise<void> {
	const client = getSqsClient();
	const command = new SendMessageCommand({
		QueueUrl: destinationQueueUrl,
		MessageBody: sourceMessage.Body,
		MessageAttributes: sourceMessage.MessageAttributes
	});
	try {
		await client.send(command);
		await deleteMessage(sourceQueueUrl, sourceMessage.ReceiptHandle as string);
	} catch (error) {
		errorHandler(error);
	}
}

export async function moveMessageBatch(sourceQueueUrl: string, destinationQueueUrl: string, sourceMessages: Message[]): Promise<void> {
	const client = getSqsClient();
	const sendCommand = new SendMessageBatchCommand({
		QueueUrl: destinationQueueUrl,
		Entries: sourceMessages.map((message) => {
			return {
				MessageBody: message.Body,
				Id: message.MessageId,
				MessageAttributes: Object.entries(message.Attributes ?? {}).reduce((result, [attributeKey, attributeValue]) => {
					result[attributeKey] = {
						DataType: typeof attributeValue === 'number' ? 'Number' : 'String',
						StringValue: attributeValue
					};
					return result;
					// eslint-disable-next-line @typescript-eslint/no-explicit-any
				}, {} as any)
			};
		})
	});
	try {
		const sendResult = await client.send(sendCommand);
		sendResult.Failed?.forEach((failedItem) => {
			console.error('sendMessage failed', failedItem);
		});
		const deleteCommand = new DeleteMessageBatchCommand({
			QueueUrl: sourceQueueUrl,
			Entries: sourceMessages.filter((message) => sendResult.Successful?.some((successItem) => successItem.Id === message.MessageId)).map((message) => {
				return {
					Id: message.MessageId,
					ReceiptHandle: message.ReceiptHandle
				};
			})
		});
		const deleteResult = await client.send(deleteCommand);
		deleteResult.Failed?.forEach((failedItem) => {
			console.error('deleteMessage failed', failedItem);
		});
	} catch (error: any) {
		errorHandler(error);
	}
}

export async function getQueueAttributes(queueUrl: string): Promise<AwsQueueAttributes> {
	const client = getSqsClient();
	const command = new GetQueueAttributesCommand({
		QueueUrl: queueUrl,
		AttributeNames: ['All']
	});
	try {
		const response = await client.send(command);
		return response.Attributes as AwsQueueAttributes;
	} catch (error) {
		errorHandler(error);
		throw error;
	}
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function errorHandler(error: any): void {
	if (error.name === 'ExpiredToken') {
		// isAuthenticatedRef.value = false;
	}
}
