import jwt from "jsonwebtoken";
import User from "../models/User";
import authConfig from "../../config/auth";

import * as Yup from "yup";

class SessionController {
  async store(req, res) {
    const schema = Yup.object().shape({
      name: Yup.string().required(),
      email: Yup.string().required(),
      password: Yup.string().required()
    });

    if (!(await schema.isValid(req.body)))
      return res.status(400).json({ error: "Validation Faile" });

    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });

    if (!user) {
      res.status(401).json({ error: "User not found" });
    }
    if (!(await user.checkPassword(password))) {
      return res.status(401).json({ error: "Password wrong" });
    }
    const { id, name } = user;
    return res.json({
      user: {
        id,
        name,
        email
      },
      token: jwt.sign({ id }, authConfig.secret, {
        expiresIn: authConfig.expiresIn
      })
    });
  }
}

export default new SessionController();
