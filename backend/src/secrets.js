import { SecretsManagerClient, GetSecretValueCommand } from '@aws-sdk/client-secrets-manager';

/**
 * Load secrets from AWS Secrets Manager
 * @param {string} secretName - Secret name/ARN in Secrets Manager
 * @returns {Promise<Object>} Parsed secret object
 */
export async function loadSecretsFromAWS(secretName) {
  const client = new SecretsManagerClient({ region: process.env.AWS_REGION || 'us-east-1' });
  
  try {
    const command = new GetSecretValueCommand({ SecretId: secretName });
    const response = await client.send(command);
    
    if (response.SecretString) {
      return JSON.parse(response.SecretString);
    }
    
    throw new Error('Secret does not contain SecretString');
  } catch (error) {
    console.error(`Failed to load secrets from AWS: ${error.message}`);
    throw error;
  }
}

/**
 * Load secrets from environment or AWS Secrets Manager
 * Falls back to .env file if AWS is not configured
 * @returns {Promise<void>}
 */
export async function initializeSecrets() {
  const useAWS = process.env.USE_AWS_SECRETS === 'true';
  const secretName = process.env.AWS_SECRET_NAME;

  if (useAWS && secretName) {
    try {
      const secrets = await loadSecretsFromAWS(secretName);
      Object.entries(secrets).forEach(([key, value]) => {
        if (!process.env[key]) {
          process.env[key] = value;
        }
      });
      console.log('Secrets loaded from AWS Secrets Manager');
    } catch (error) {
      console.error('Failed to load secrets from AWS, falling back to environment variables');
      if (process.env.NODE_ENV === 'production') {
        throw error;
      }
    }
  }
}
