import type { AwsCredentials } from '@/types/aws';
import { ref, watch } from '@vue/composition-api';

export const defaultAwsCredentials: AwsCredentials = {
	accessKeyId: '',
	secretAccessKey: '',
	sessionToken: ''
};

export const isAuthenticatedRef = ref<boolean>();
export const currentRegionRef = ref<string>();
export const awsCredentialsRef = ref<AwsCredentials>();

watch(isAuthenticatedRef, (value) => {
	if (value === false) {
		awsCredentialsRef.value = defaultAwsCredentials;
	}
	localStorage.setItem('isAuthenticated', String(value));
});

watch(currentRegionRef, (value) => {
	if (value !== undefined) {
		localStorage.setItem('currentRegion', value);
	}
});

watch(awsCredentialsRef, (value) => {
	localStorage.setItem('awsCredentials', JSON.stringify(value));
});

const isAuthenticatedCache: string | null = localStorage.getItem('isAuthenticated');
isAuthenticatedRef.value = isAuthenticatedCache !== null ? Boolean(isAuthenticatedCache) : false;

const currentRegionCache: string | null = localStorage.getItem('currentRegion');
currentRegionRef.value = currentRegionCache ?? 'eu-central-1';

const awsCredentialsCache: string | null = localStorage.getItem('awsCredentials');
awsCredentialsRef.value = awsCredentialsCache ? JSON.parse(awsCredentialsCache) : defaultAwsCredentials;
