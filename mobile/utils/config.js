import Constants from 'expo-constants';

// Automatically get the IP address of the machine running the dev server
const debuggerHost = Constants.expoConfig?.hostUri;
const localhost = debuggerHost?.split(':')[0];

const DEV_API_URL = process.env.EXPO_PUBLIC_API_URL || (localhost 
  ? `http://${localhost}:5000/api` 
  : 'http://10.181.151.246:5000/api'); // Fallback to your current IP

const BASE_URL = process.env.EXPO_PUBLIC_BASE_URL || (localhost
  ? `http://${localhost}:5000`
  : 'http://10.181.151.246:5000');

export const API_URL = DEV_API_URL;
export const UPLOAD_URL = `${BASE_URL}/uploads`;
