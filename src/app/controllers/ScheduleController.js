import Appoitements from "../models/Appoitements";
import User from "../models/User";

import { startOfDay, endOfDay, parseISO } from "date-fns";
import { Op } from "sequelize";

class ScheduleController {
  async index(req, res) {
    const checkUserProvider = await User.findOne({
      where: { id: req.userId, provider: true }
    });

    if (!checkUserProvider) {
      return res.status(401).json({ error: "User not Provider" });
    }

    const { date } = req.query;
    const parsedDate = parseISO(date);

    const appoitements = await Appoitements.findAll({
      where: {
        provider_id: req.userId,
        canceled_at: null,
        date: {
          [Op.between]: [startOfDay(parsedDate), endOfDay(parsedDate)]
        }
      },
      order: ["date"]
    });

    return res.json(appoitements);
  }
}

export default new ScheduleController();
