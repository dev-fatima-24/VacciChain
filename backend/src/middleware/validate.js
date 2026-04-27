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
