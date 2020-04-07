import Appoitements from "../models/Appoitements";
import Notification from "../schemas/Notification";
import File from "../models/File";
import User from "../models/User";
import Queue from "../../lib/Queue";
import CancellationMail from "../jobs/CancellationMail";

import * as Yup from "yup";
import { startOfHour, parseISO, isBefore, format, subHours } from "date-fns";
import pt from "date-fns/locale/pt";

class AppoitementsController {
  async index(req, res) {
    const { page = 1 } = req.query;
    const appoitement = await Appoitements.findAll({
      where: { user_id: req.userId, canceled_at: null },
      order: ["date"],
      limit: 20,
      offset: (page - 1) * 20,
      attributes: ["id", "date", "past", "cancelable"],
      include: [
        {
          model: User,
          as: "provider",
          attributes: ["id", "name"],
          include: [
            {
              model: File,
              as: "avatar",
              attributes: ["id", "path", "url"]
            }
          ]
        }
      ]
    });
    return res.json(appoitement);
  }

  async store(req, res) {
    const schema = Yup.object().shape({
      provider_id: Yup.number().required(),
      date: Yup.date().required()
    });
    if (!(await schema.isValid(req.body))) {
      return res.status(400).json({ error: "Validation Fails" });
    }

    const { provider_id, date } = req.body;
    //Check if provider_id is a provider

    const checkIsProvider = await User.findOne({
      where: { id: provider_id, provider: true }
    });

    if (!checkIsProvider) {
      return res
        .status(401)
        .json({ error: "You can only create with providers" });
    }

    //Check past date
    const hourStart = startOfHour(parseISO(date));

    if (isBefore(hourStart, new Date())) {
      return res.status(400).json({ error: "Past dates are not permitted" });
    }

    //Check Availability
    const checkAvailability = await Appoitements.findOne({
      where: {
        provider_id,
        canceled_at: null,
        date: hourStart
      }
    });

    if (checkAvailability) {
      return res.status(400).json({ error: "Appointmente not avaibele" });
    }

    const appoitement = await Appoitements.create({
      user_id: req.userId,
      provider_id,
      date
    });

    //Notify Provider

    const user = await User.findByPk(req.userId);
    const formattedDate = format(
      hourStart,
      "'dia' dd 'de' MMMM', às' H:mm'h' ",
      { locale: pt }
    );

    await Notification.create({
      content: `Novo agendamento de ${user.name} para ${formattedDate}`,
      user: provider_id
    });

    return res.json(appoitement);
  }

  async delete(req, res) {
    const appoitement = await Appoitements.findByPk(req.params.id, {
      include: [
        {
          model: User,
          as: "provider",
          attributes: ["name", "email"]
        },
        {
          model: User,
          as: "user",
          attributes: ["name"]
        }
      ]
    });

    if (appoitement.user_id != req.userId) {
      return res
        .status(401)
        .json({ error: "You dont have permission to cancel this appoitment" });
    }

    const dateWithSub = subHours(appoitement.date, 2);

    if (isBefore(dateWithSub, new Date())) {
      return res
        .status(401)
        .json({ error: "you can only cancel appoitemnts to hours in advance" });
    }

    appoitement.canceled_at = new Date();

    await appoitement.save();

    await Queue.add(CancellationMail.key, {
      appoitement
    });

    res.json(appoitement);
  }
}

export default new AppoitementsController();
