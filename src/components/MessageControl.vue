<template>
  <v-container fluid>
    <v-row>
      <v-col class="d-flex" cols="3">
        <v-select
          :items="queueSelectItems"
          v-model="selectedQueueUrl"
          itemText="name"
          itemValue="url"
          label="Choose SQS Queue (Messages / Not Visible)"
          :loading="isLoadingQueues"
        >
          <template #append-outer>
            <v-btn
              :loading="isLoadingQueues"
              color="success"
              @click="refreshQueues"
            >
              <v-icon>
                mdi-refresh-circle
              </v-icon>
            </v-btn>
          </template>
        </v-select>

      </v-col>
      <v-col cols="9" v-if="selectedQueue">
        <v-chip
          class="ma-2"
          color="green"
          text-color="white"
        >
          <v-avatar left class="green darken-4">
            {{ selectedQueue.attributes.ApproximateNumberOfMessages }}
          </v-avatar>
          Messages
        </v-chip>
        <v-chip
          class="ma-2"
          color="green"
          text-color="white"
        >
          <v-avatar left class="green darken-4">
            {{ selectedQueue.attributes.ApproximateNumberOfMessagesDelayed }}
          </v-avatar>
          MessagesDelayed
        </v-chip>
        <v-chip
          class="ma-2"
          color="green"
          text-color="white"
        >
          <v-avatar left class="green darken-4">
            {{ selectedQueue.attributes.ApproximateNumberOfMessagesNotVisible }}
          </v-avatar>
          MessagesNotVisible
        </v-chip>
        <v-chip
          class="ma-2"
          color="green"
          text-color="white"
        >
          <v-avatar left class="green darken-4">
            {{ selectedQueue.attributes.ReceiveMessageWaitTimeSeconds }}
          </v-avatar>
          ReceiveMessageWaitTimeSeconds
        </v-chip>
        <v-chip
          class="ma-2"
          color="green"
          text-color="white"
        >
          <v-avatar left class="green darken-4">
            {{ selectedQueue.attributes.DelaySeconds }}
          </v-avatar>
          DelaySeconds
        </v-chip>
        <v-chip
          class="ma-2"
          color="green"
          text-color="white"
        >
          <v-avatar left class="green darken-4">
            {{ selectedQueue.attributes.VisibilityTimeout }}
          </v-avatar>
          VisibilityTimeout
        </v-chip>
      </v-col>
    </v-row>
    <v-row align="center">
      <v-col>
        <v-data-table
          :items="messages"
          item-key="MessageId"
          :headers="messageTableHeaders"
          class="elevation-3"
          show-select
          show-expand
          :loading="isLoadingMessages"
          v-model="selectedMessages"
        >
          <template #[`item.Attributes`]="{ item }">
            <v-list-item
              two-line
              v-for="(key) of ['ApproximateReceiveCount', 'SenderId']"
              :key="key"
            >
              <v-list-item-content>
                <v-list-item-title>{{ key }}</v-list-item-title>
                <v-list-item-subtitle>{{ item.Attributes[key] }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </template>
          <template #[`item.DateAttributes`]="{ item }">
            <v-list-item
              two-line
              v-for="(key) of ['ApproximateFirstReceiveTimestamp', 'SentTimestamp']"
              :key="key"
            >
              <v-list-item-content>
                <v-list-item-title>{{ key }}</v-list-item-title>
                <v-list-item-subtitle>{{ formatDateAttribute(item.Attributes[key]) }}</v-list-item-subtitle>
              </v-list-item-content>
            </v-list-item>
          </template>
          <template #[`item.MessageAttributes`]="{ value }">
            <template v-if="value">
              <v-list-item
                two-line
                v-for="(attr, key) of value"
                :key="key"
              >
                <v-list-item-content>
                  <v-list-item-title>{{ key }}</v-list-item-title>
                  <v-list-item-subtitle>{{ attr.StringValue }}</v-list-item-subtitle>
                </v-list-item-content>
              </v-list-item>
            </template>
          </template>
          <template #expanded-item="{ headers, item }">
            <td :colspan="headers.length + 1">
              <vue-json-pretty
                v-if="isJson(item.Body)"
                :data="JSON.parse(item.Body)"
              ></vue-json-pretty>
              <span v-else>{{ item.Body }}</span>
            </td>
          </template>
          <template #[`footer.prepend`]>
            <v-btn
              color="error"
              :disabled="!selectedMessages.length"
              :loading="isLoadingDeleteButton"
              @click="btnDeleteMessages"
            >
              <v-icon left>
                mdi-delete-circle
              </v-icon>
              Delete {{ messageText }}
            </v-btn>
            <v-menu offset-y>
              <template v-slot:activator="{ on, attrs }">
                <v-btn
                  color="primary"
                  v-bind="attrs"
                  v-on="on"
                  class="ml-3"
                  :loading="isLoadingMoveButton"
                  :disabled="!selectedMessages.length"
                >
                  <v-icon left>
                    mdi-arrow-right-bold-circle
                  </v-icon>
                  Move {{ messageText }}
                </v-btn>
              </template>
              <v-list>
                <v-list-item
                  v-for="(queue, index) in sqsQueues"
                  :key="index"
                  link
                >
                  <v-list-item-title
                    @click="btnMoveMessages(queue)"
                  >{{ queue.name }}</v-list-item-title>
                </v-list-item>
              </v-list>
            </v-menu>
            <v-btn
              color="primary"
              class="ml-3"
              :disabled="!selectedQueueUrl"
              @click="isCreateDialogOpen = true"
            >
              <v-icon left>
                mdi-plus-circle
              </v-icon>
              Create Message
            </v-btn>
            <v-btn
              color="error"
              class="ml-3"
              @click="btnPurgeQueue"
              :loading="isLoadingPurgeButton"
              :disabled="!selectedQueueUrl"
            >
              <v-icon left>
                mdi-delete-circle
              </v-icon>
              Purge Queue
            </v-btn>
            <v-btn
              color="success"
              :loading="isLoadingMessages"
              class="ml-3"
              :disabled="!selectedQueueUrl"
              @click="refreshMessages"
            >
              <v-icon left>
                mdi-refresh-circle
              </v-icon>
              Poll Messages
            </v-btn>
            <v-text-field
              v-model="pollSeconds"
              type="number"
              max="60"
              min="1"
              class="ml-5 mt-6"
              style="max-width: 100px;"
              label="Poll seconds"
              outlined
              dense
              :disabled="isLoadingMessages"
            ></v-text-field>
          </template>
        </v-data-table>
      </v-col>
    </v-row>
    <v-dialog
      v-model="isCreateDialogOpen"
      max-width="1000px"
    >
      <v-card>
        <v-card-title>
          <span class="text-h5">Create Message</span>
        </v-card-title>
        <v-card-text>
          <v-container>
            <v-row>
              <v-col cols="12">
                <v-textarea
                  outlined
                  label="Body (Required)"
                  v-model="dialogMessage.body"
                  required
                ></v-textarea>
              </v-col>
              <v-col cols="12">
                <v-slider
                  v-model="dialogMessage.delaySeconds"
                  label="DelaySeconds"
                  thumb-label="always"
                  max="900"
                ></v-slider>
              </v-col>
            </v-row>
            <v-row
              v-for="(attribute, index) of dialogMessage.messageAttributes"
              :key="attribute.id"
            >
              <v-col cols="3">
                <v-text-field
                  label="Name"
                  v-model="attribute.name"
                  :key="index"
                ></v-text-field>
              </v-col>
              <v-col cols="2">
                <v-select
                  :items="['string', 'number']"
                  label="Type"
                  required
                  v-model="attribute.type"
                ></v-select>
              </v-col>
              <v-col cols="6">
                <v-text-field
                  label="Value"
                  v-model="attribute.value"
                ></v-text-field>
              </v-col>
              <v-col cols="1">
                <v-btn
                  color="primary"
                  icon
                  @click="dialogMessage.messageAttributes.splice(index, 1)"
                >
                  <v-icon>
                    mdi-minus-circle
                  </v-icon>
                </v-btn>
              </v-col>
            </v-row>
          </v-container>
        </v-card-text>
        <v-card-actions>
          <v-btn
            text
            color="primary"
            @click="dialogMessage.messageAttributes.push(defaultDialogMessageAttribute())"
          >
            <v-icon left>
              mdi-plus-circle
            </v-icon>
            Add Message Attribute
          </v-btn>
          <v-spacer></v-spacer>
          <v-btn
            text
            @click="isCreateDialogOpen = false"
          >
            <v-icon left>
              mdi-close-circle
            </v-icon>
            Close
          </v-btn>
          <v-btn
            color="primary"
            text
            @click="btnCreateNewMessage"
            :loading="isLoadingCreateMessageButton"
            :disabled="!dialogMessage.body"
          >
            <v-icon left>
              mdi-content-save
            </v-icon>
            Create
          </v-btn>
        </v-card-actions>
      </v-card>
    </v-dialog>
    <v-snackbar
      :timeout="5000"
      v-model="showError"
      color="red"
      top
    >
      {{ errorMessage }}
    </v-snackbar>
  </v-container>
</template>

<script lang="ts">
import {
	computed,
	ComputedRef,
	defineComponent,
	onMounted,
	ref,
	watch
} from '@vue/composition-api'
import { createMessage, deleteMessage, getQueues, moveMessage, pollMessages, purgeQueue } from '../modules/sqsClient'
import { AwsQueue, NewSqsMessage, NewSqsMessageAttribute } from '../types/aws'
import { Message } from '@aws-sdk/client-sqs'
import { currentRegionRef } from '@/modules/awsConfig'

export default defineComponent({
	setup() {
		const isLoadingDeleteButton = ref<boolean>(false)
		const isLoadingMoveButton = ref<boolean>(false)
		const isLoadingPurgeButton = ref<boolean>(false)
		const isLoadingCreateMessageButton = ref<boolean>(false)
		const isLoadingMessages = ref<boolean>(false)
		const isLoadingQueues = ref<boolean>(true)
		const isCreateDialogOpen = ref<boolean>(false)
		const messages = ref<Message[]>([])
		const selectedMessages = ref<Message[]>([])
		const selectedQueueUrl = ref<string | null>(null)
		const sqsQueues = ref<AwsQueue[]>([])
		const showError = ref(false)
		const errorMessage = ref<string>('')
		const pollSeconds = ref<number>(5)

		const defaultDialogMessage: NewSqsMessage = {
			body: '',
			messageAttributes: [],
			delaySeconds: 0
		}
		function defaultDialogMessageAttribute(): NewSqsMessageAttribute {
			return {
				name: '',
				type: 'string',
				value: '',
				id: new Date().toISOString()
			}
		}
		const dialogMessage = ref<NewSqsMessage>(defaultDialogMessage)

		const messageTableHeaders = [
			{
				text: 'MessageId',
				value: 'MessageId'
			},
			{
				text: 'Attributes',
				value: 'Attributes'
			},
			{
				text: 'DateAttributes',
				value: 'DateAttributes'
			},
			{
				text: 'MessageAttributes',
				value: 'MessageAttributes'
			},
			{
				text: 'MD5OfBody',
				value: 'MD5OfBody'
			}
		]

		async function refreshMessages() {
			isLoadingMessages.value = true
			if (selectedQueueUrl.value) {
				messages.value = await pollMessages(selectedQueueUrl.value, pollSeconds.value)
			} else {
				messages.value = []
			}
			isLoadingMessages.value = false
		}

		async function refreshQueues() {
			isLoadingQueues.value = true
			sqsQueues.value = await getQueues()
			if (!sqsQueues.value.find((queue) => queue.url === selectedQueueUrl.value)) {
				selectedQueueUrl.value = null
			}
			isLoadingQueues.value = false
		}

		onMounted(async () => {
			refreshQueues()
		})

		watch(currentRegionRef, async () => {
			refreshQueues()
		})

		selectedQueueUrl.value = localStorage.getItem('selectedQueueUrl')

		watch(selectedQueueUrl, async () => {
			if (selectedQueueUrl.value) {
				localStorage.setItem('selectedQueueUrl', selectedQueueUrl.value)
			}
			refreshMessages()
		})

		const messageText = computed(() => {
			return selectedMessages.value.length === 1 ? 'Message' : 'Messages'
		})

		async function btnPurgeQueue() {
			isLoadingPurgeButton.value = true
			if (selectedQueueUrl.value) {
				await purgeQueue(selectedQueueUrl.value)
				refreshMessages()
			}
			isLoadingPurgeButton.value = false
		}

		function removeMessagesFromList(messagesToRemove: Message[]): void {
			messages.value = messages.value.reduce((result, message) => {
				if (!messagesToRemove.some((messagesToRemove) => messagesToRemove.ReceiptHandle === message.ReceiptHandle)) {
					result.push(message)
				}
				return result
			}, [] as Message[])
		}

		async function btnDeleteMessages() {
			if (selectedQueueUrl.value) {
				const queueUrl = selectedQueueUrl.value
				isLoadingDeleteButton.value = true
				await Promise.all(selectedMessages.value.map(async (message) => {
					await deleteMessage(queueUrl, message.ReceiptHandle as string)
				}))
				removeMessagesFromList(selectedMessages.value)
				isLoadingDeleteButton.value = false
			}
		}

		async function btnMoveMessages(destinationQueue: AwsQueue): Promise<void> {
			isLoadingMoveButton.value = true

			await Promise.all(selectedMessages.value.map(async (messageToMove: Message) => {
				try {
					if (selectedQueueUrl.value) {
						await moveMessage(selectedQueueUrl.value, destinationQueue.url, messageToMove)
						removeMessagesFromList([messageToMove])
					}
				} catch (error) {
					console.log(error)
				}
			}))
			isLoadingMoveButton.value = false
		}

		async function btnCreateNewMessage() {
			isLoadingCreateMessageButton.value = true
			if (selectedQueueUrl.value) {
				try {
					await createMessage(selectedQueueUrl.value, dialogMessage.value)
					isCreateDialogOpen.value = false
					refreshMessages()
				} catch (error) {
					errorMessage.value = error.toString()
					showError.value = true
				}
			}
			isLoadingCreateMessageButton.value = false
		}

		function isJson(text: string): boolean {
			try {
				JSON.parse(text)
				return true
			} catch (error) {
				return false
			}
		}

		function formatDateAttribute(value: string): string {
			const date = new Date(Number(value))
			return `${date.toLocaleString()} (${date.toISOString()})`
		}

		const selectedQueue: ComputedRef<AwsQueue | undefined> = computed(() => {
			if (selectedQueueUrl.value) {
				return sqsQueues.value.find((queue) => queue.url === selectedQueueUrl.value)
			}
		})

		const queueSelectItems = computed(() => {
			return sqsQueues.value.map((queue) => {
				const { ApproximateNumberOfMessages, ApproximateNumberOfMessagesNotVisible } = queue.attributes
				queue.name += ` (${ApproximateNumberOfMessages}/${ApproximateNumberOfMessagesNotVisible})`
				return queue
			})
		})

		return {
			btnCreateNewMessage,
			btnDeleteMessages,
			btnMoveMessages,
			btnPurgeQueue,
			dialogMessage,
			defaultDialogMessageAttribute,
			errorMessage,
			formatDateAttribute,
			isLoadingCreateMessageButton,
			isLoadingDeleteButton,
			isLoadingMoveButton,
			isLoadingPurgeButton,
			isLoadingMessages,
			isLoadingQueues,
			isCreateDialogOpen,
			messageTableHeaders,
			messageText,
			messages,
			pollSeconds,
			refreshMessages,
			refreshQueues,
			selectedMessages,
			selectedQueueUrl,
			selectedQueue,
			sqsQueues,
			showError,
			queueSelectItems,
			isJson
		}
	}
})
</script>
