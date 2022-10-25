import type { AwsCredentials } from '@/types/aws';
import { ref, watch } from '@vue/composition-api';
import { refreshQueues } from './sqsClient';

export const defaultAwsCredentials: AwsCredentials = {
	accessKeyId: '',
	secretAccessKey: '',
	sessionToken: ''
};

export const currentRegionRef = ref<string>();

watch(currentRegionRef, (value) => {
	if (value !== undefined) {
		localStorage.setItem('currentRegion', value);
		refreshQueues();
	}
});

const currentRegionCache: string | null = localStorage.getItem('currentRegion');
currentRegionRef.value = currentRegionCache ?? 'eu-central-1';
