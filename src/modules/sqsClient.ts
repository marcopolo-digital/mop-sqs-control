import type { AwsQueue, NewSqsMessage } from '@/types/aws'
import type { Message } from '@aws-sdk/client-sqs'
import { SQSClient, ListQueuesCommand, ReceiveMessageCommand, PurgeQueueCommand, DeleteMessageCommand, SendMessageCommand } from '@aws-sdk/client-sqs'
import { awsCredentialsRef, currentRegionRef, isAuthenticatedRef } from '../modules/awsConfig'

function getSqsClient(): SQSClient {
	return new SQSClient({
		region: currentRegionRef.value,
		credentials: awsCredentialsRef.value
	})
}

export async function getQueues(): Promise<AwsQueue[]> {
	const client = getSqsClient()
	const command = new ListQueuesCommand({})

	try {
		const queuesResponse = await client.send(command)

		if (!queuesResponse.QueueUrls) {
			return []
		}

		return queuesResponse.QueueUrls.map((queueUrl) => {
			const queueParts = queueUrl.split('/')

			return {
				url: queueUrl,
				accountNumber: queueParts[3],
				name: queueParts[4]
			}
		})
	} catch (error) {
		if (error.name === 'ExpiredToken') {
			isAuthenticatedRef.value = false
		}
		return []
	}
}

export async function getMessages(queueUrl: string): Promise<Message[]> {
	if (!queueUrl) {
		return []
	}
	const client = getSqsClient()
	const command = new ReceiveMessageCommand({
		QueueUrl: queueUrl,
		MaxNumberOfMessages: 10,
		WaitTimeSeconds: 2,
		MessageAttributeNames: ['All'],
		AttributeNames: ['All']
	})

	try {
		const messagesResponse = await client.send(command)
		if (!messagesResponse.Messages) {
			return []
		}

		return messagesResponse.Messages
	} catch (error) {
		if (error.name === 'ExpiredToken') {
			isAuthenticatedRef.value = false
		}
		return []
	}
}

export async function purgeQueue(queueUrl: string): Promise<void> {
	const client = getSqsClient()
	const command = new PurgeQueueCommand({
		QueueUrl: queueUrl
	})
	await client.send(command)
}

export async function deleteMessage(queueUrl: string, receiptHandle: string): Promise<void> {
	const client = getSqsClient()
	const command = new DeleteMessageCommand({
		QueueUrl: queueUrl,
		ReceiptHandle: receiptHandle
	})
	await client.send(command)
}

export async function createMessage(queueUrl: string, message: NewSqsMessage): Promise<void> {
	const client = getSqsClient()
	const command = new SendMessageCommand({
		QueueUrl: queueUrl,
		DelaySeconds: message.delaySeconds,
		MessageBody: message.body,
		MessageAttributes: message.messageAttributes.reduce((result, message) => {
			result[message.name] = {
				DataType: message.type === 'number' ? 'Number' : 'String',
				StringValue: message.value
			}
			return result
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
		}, {} as any)
	})
	await client.send(command)
}

export async function moveMessage(sourceQueueUrl: string, destinationQueueUrl: string, sourceMessage: Message): Promise<void> {
	const client = getSqsClient()
	const command = new SendMessageCommand({
		QueueUrl: destinationQueueUrl,
		MessageBody: sourceMessage.Body,
		MessageAttributes: sourceMessage.MessageAttributes
	})
	await client.send(command)
	await deleteMessage(sourceQueueUrl, sourceMessage.ReceiptHandle as string)
}
