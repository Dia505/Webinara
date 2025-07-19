const UserLog = require("../model/user_log");

const findAll = async (req, res) => {
  try {
    const userLog = await UserLog.find();
    res.status(200).json(userLog);
  }
  catch (e) {
    res.json(e)
  }
}

module.exports = { findAll };