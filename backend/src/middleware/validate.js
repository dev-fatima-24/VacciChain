/**
 * Request body validation middleware factory.
 *
 * Creates a middleware that validates the request body against a Zod schema.
 * Strips unknown fields and returns detailed validation errors.
 *
 * @param {Object} schema - A Zod schema object for validation
 *
 * @returns {Function} Express middleware function
 *
 * @example
 * const schema = z.object({
 *   email: z.string().email(),
 *   age: z.number().min(0),
 * });
 * app.post('/users', validate(schema), (req, res) => {
 *   // req.body is now validated and typed
 * });
 *
 * @throws {Error} 400 - Validation failed with detailed error messages
 *
 * @side-effects Modifies req.body to contain only validated fields
 */
const validate = (schema) => (req, res, next) => {
  try {
    // parse and strip unknown fields
    const validated = schema.parse(req.body);
    req.body = validated;
    next();
  } catch (err) {
    if (err.issues) {
      return res.status(400).json({
        error: 'Validation failed',
        details: err.issues.map((e) => ({
          path: e.path.join('.'),
          message: e.message,
        })),
      });
    }
    next(err);
  }
};

module.exports = validate;
