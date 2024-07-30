const jwt = require("jsonwebtoken");
const User = require("../models/user");

const auth = async (req, res, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Not authorized" });
  }
  try {
    const { id } = jwt.verify(token, 'eyJhbGciOiJIUzI1NiJ9.eyJSb2xlIjoiQWRtaW4iLCJJc3N1ZXIiOiJJc3N1ZXIiLCJVc2VybmFtZSI6IkphdmFJblVzZSIsImV4cCI6MTc4NTI3NDI0OCwiaWF0IjoxNzIyMjAyMjQ4fQ.yxSm79EAIUO64ZAn9CsKDY-2oRcTNmzNEGL6U8FV2hg');
    const user = await User.findById(id);
    if (!user || user.token !== token) {
      return res.status(401).json({ message: "Not authorized" });
    }
    req.user = user;
    req.token = token;
    next();
  } catch (error) {
    next(error);
  }
};

module.exports = auth;
