<template>
<v-layout justify-center>
  <v-card
    elevation="4"
    class="loginCard"
  >
    <v-form
      ref="form"
      lazy-validation
    >
      <v-select
        :items="Object.keys(awsRegions)"
        v-model="currentRegionRef"
        label="defaultRegion"
        required
      ></v-select>

      <v-text-field
        v-model="credentialsRef.accessKeyId"
        label="accessKeyId"
        required
      ></v-text-field>

      <v-text-field
        v-model="credentialsRef.secretAccessKey"
        label="secretAccessKey"
        required
      ></v-text-field>

      <v-text-field
        v-model="credentialsRef.sessionToken"
        label="sessionToken"
        required
      ></v-text-field>

      <v-btn
        color="success"
        class="mr-4"
        @click="checkCredentials"
      >
        Validate & Save
      </v-btn>

    </v-form>
  </v-card>
      <v-snackbar
      :timeout="3000"
      v-model="showError"
      color="red"
      top
    >
      Invalid Credentials!
    </v-snackbar>
  </v-layout>
</template>

<script lang="ts">

import { defineComponent, ref } from '@vue/composition-api'
import awsRegions from '../modules/awsRegions'
import { currentRegionRef, isAuthenticatedRef, defaultAwsCredentials, awsCredentialsRef } from '../modules/awsConfig'
import { GetAccessKeyInfoCommand, STSClient } from '@aws-sdk/client-sts'
import { AwsCredentials } from '../types/aws'

export default defineComponent({
	setup() {
		const showError = ref(false)
		const credentialsRef = ref<AwsCredentials>(defaultAwsCredentials)

		async function checkCredentials() {
			const stsClient = new STSClient({
				region: currentRegionRef.value,
				credentials: credentialsRef.value
			})
			const stsCommand = new GetAccessKeyInfoCommand({
				AccessKeyId: credentialsRef.value.accessKeyId
			})
			try {
				await stsClient.send(stsCommand)
				awsCredentialsRef.value = credentialsRef.value
				localStorage.setItem('awsCredentials', JSON.stringify(awsCredentialsRef.value))
				isAuthenticatedRef.value = true
			} catch (error) {
				showError.value = true
			}
		}

		return {
			checkCredentials,
			awsRegions,
			currentRegionRef,
			showError,
			credentialsRef
		}
	}
})

</script>

<style scoped>
.loginCard {
  padding: 50px;
  margin: 50px;
  min-width: 500px;
}
</style>
