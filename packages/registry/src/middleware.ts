import { NextFunction, Request, Response } from 'express';

interface AuthenticatedRequest extends Request {
  auth?: {
    apiKey: string;
  };
}

export const authMiddleware = async (
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['bx_auth'];

    if (!authHeader) {
      res.status(401).json({
        error: 'Authentication required',
        message: 'Missing bx_auth header'
      });
      return;
    }

    // If header is an array, take the first value
    const apiKey = Array.isArray(authHeader) ? authHeader[0] : authHeader;

    if (apiKey !== "test_key") {
      res.status(401).json({
        error: 'Authentication failed',
        message: 'Invalid API key'
      });
      return;
    }

    // Attach auth info to request for use in subsequent middleware/routes
    req.auth = {
      apiKey
    };

    next();
  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to process authentication'
    });
  }
};

