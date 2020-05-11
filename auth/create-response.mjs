import { coalesce } from '../modules/utils.mjs';

function createSuccessResponse(response) {
  return { status: 'ok', ...response };
}

function createFailureResponse(errors) {
  return { status: 'failed', errors };
}

function createTokenResponse(accessToken, refreshToken) {
  return createSuccessResponse({
    ...(coalesce(accessToken) && { accessToken }),
    ...(coalesce(refreshToken) && { refreshToken }),
  });
}

function createPayloadResponse(payload) {
  return createSuccessResponse({
    ...(payload && payload.type === 'access' && { accessToken: payload }),
    ...(payload && payload.type === 'refresh' && { refreshToken: payload }),
  });
}

export { createSuccessResponse, createFailureResponse, createTokenResponse, createPayloadResponse };
