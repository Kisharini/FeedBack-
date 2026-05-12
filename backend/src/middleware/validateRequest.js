const { StatusCodes } = require("http-status-codes");

const validateRequest = (schema) => (req, res, next) => {
  const result = schema.safeParse({
    body: req.body,
    params: req.params,
    query: req.query
  });

  if (!result.success) {
    const flattened = result.error.flatten();
    const detailedFieldErrors = {};

    result.error.issues.forEach((issue) => {
      const [scope, field] = issue.path;

      if (scope === "body" && typeof field === "string") {
        if (!detailedFieldErrors[field]) {
          detailedFieldErrors[field] = [];
        }

        detailedFieldErrors[field].push(issue.message);
      }
    });

    return res.status(StatusCodes.BAD_REQUEST).json({
      success: false,
      message: "Validation failed",
      errors: {
        formErrors: flattened.formErrors,
        fieldErrors: {
          ...flattened.fieldErrors,
          ...detailedFieldErrors
        }
      }
    });
  }

  req.validated = result.data;
  return next();
};

module.exports = validateRequest;
