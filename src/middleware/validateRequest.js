const { StatusCodes } = require("http-status-codes");

const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (!result.success) {
    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors: result.error.flatten()
    });
  }

  req.validated = result.data;
  return next();
};

module.exports = validateRequest;
