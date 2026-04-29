module.exports = {
  initializeSecrets: jest.fn().mockResolvedValue(undefined),
  loadSecretsFromAWS: jest.fn().mockResolvedValue({}),
};
