import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import type { AuthService } from '../services/auth.service.ts';
import { registerSchema, loginSchema, refreshTokenSchema } from '../validators/auth.validators.ts';
import type { RegisterInput, LoginInput, RefreshTokenInput } from '../validators/auth.validators.ts';
import { validationHook } from '../../../core/helpers/validator.ts';
import { ApiResponse } from '../../../core/helpers/response.ts';
import { authMiddleware } from '../../../core/middlewares/auth.middleware.ts';

type AppEnv = {
  Variables: {
    tenantId: string;
    user: { id: string; tenantId: string; email: string; role: string };
  };
};

/**
 * Creates the auth controller with all routes.
 * Factory pattern for dependency injection.
 */
export function createAuthController(authServiceFactory: (tenantId: string) => AuthService) {
  const app = new OpenAPIHono<AppEnv>();

  // POST /register
  const registerRoute = createRoute({
    method: 'post',
    path: '/register',
    tags: ['Auth'],
    summary: 'Register a new user',
    request: {
      body: {
        content: {
          'application/json': {
            schema: registerSchema,
          },
        },
      },
    },
    responses: {
      201: {
        description: 'User registered successfully',
        content: { 'application/json': { schema: z.object({ success: z.boolean(), statusCode: z.number(), message: z.string(), data: z.any() }) } },
      },
      409: { description: 'Email already registered' },
      422: { description: 'Validation error' },
    },
  });

  app.openapi(registerRoute, async (c) => {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as RegisterInput;
    const authService = authServiceFactory(tenantId);
    const result = await authService.register(tenantId, body);
    return ApiResponse.created(c, result, 'User registered successfully') as any;
  }, validationHook);

  // POST /login
  const loginRoute = createRoute({
    method: 'post',
    path: '/login',
    tags: ['Auth'],
    summary: 'Login with email and password',
    request: {
      body: {
        content: {
          'application/json': {
            schema: loginSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Login successful',
        content: { 'application/json': { schema: z.object({ success: z.boolean(), statusCode: z.number(), message: z.string(), data: z.any() }) } },
      },
      401: { description: 'Invalid credentials' },
    },
  });

  app.openapi(loginRoute, async (c) => {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as LoginInput;
    const authService = authServiceFactory(tenantId);
    const result = await authService.login(tenantId, body);
    return ApiResponse.success(c, result, 'Login successful') as any;
  }, validationHook);

  // POST /refresh
  const refreshRoute = createRoute({
    method: 'post',
    path: '/refresh',
    tags: ['Auth'],
    summary: 'Refresh access token',
    request: {
      body: {
        content: {
          'application/json': {
            schema: refreshTokenSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Token refreshed successfully',
        content: { 'application/json': { schema: z.object({ success: z.boolean(), statusCode: z.number(), message: z.string(), data: z.any() }) } },
      },
      401: { description: 'Invalid refresh token' },
    },
  });

  app.openapi(refreshRoute, async (c) => {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as RefreshTokenInput;
    const authService = authServiceFactory(tenantId);
    const tokens = await authService.refreshToken(tenantId, body.refreshToken);
    return ApiResponse.success(c, tokens, 'Token refreshed successfully') as any;
  }, validationHook);

  // POST /logout
  const logoutRoute = createRoute({
    method: 'post',
    path: '/logout',
    tags: ['Auth'],
    summary: 'Logout (revoke refresh token)',
    request: {
      body: {
        content: {
          'application/json': {
            schema: refreshTokenSchema,
          },
        },
      },
    },
    responses: {
      200: {
        description: 'Logged out successfully',
        content: { 'application/json': { schema: z.object({ success: z.boolean(), statusCode: z.number(), message: z.string(), data: z.any() }) } },
      },
    },
  });

  app.openapi(logoutRoute, async (c) => {
    const tenantId = c.get('tenantId');
    const body = c.req.valid('json') as RefreshTokenInput;
    const authService = authServiceFactory(tenantId);
    await authService.logout(tenantId, body.refreshToken);
    return ApiResponse.success(c, null, 'Logged out successfully') as any;
  }, validationHook);

  // GET /me (protected)
  const meRoute = createRoute({
    method: 'get',
    path: '/me',
    tags: ['Auth'],
    summary: 'Get current user profile',
    security: [{ Bearer: [] }],
    responses: {
      200: {
        description: 'User profile',
        content: { 'application/json': { schema: z.object({ success: z.boolean(), statusCode: z.number(), message: z.string(), data: z.any() }) } },
      },
      401: { description: 'Unauthorized' },
    },
  });

  // Apply auth middleware only to /me
  app.use('/me', authMiddleware);

  app.openapi(meRoute, async (c) => {
    const user = c.get('user');
    const authService = authServiceFactory(user.tenantId);
    const profile = await authService.getProfile(user.tenantId, user.id);
    return ApiResponse.success(c, profile, 'Profile retrieved successfully') as any;
  });

  return app;
}
