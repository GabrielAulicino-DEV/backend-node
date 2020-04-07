import Mail from "../../lib/Mail";

import { format, parseISO } from "date-fns";
import pt from "date-fns/locale/pt";

class CancellationMail {
  get key() {
    return "CancellationMail";
  }
  async handle({ data }) {
    const { appoitement } = data;

    console.log("A Fila Executou", appoitement);

    await Mail.sendMail({
      to: `${appoitement.provider.name} <${appoitement.provider.email}>`,
      subject: "Agendamento Cancelado",
      template: "cancellation",
      context: {
        provider: appoitement.provider.name,
        user: appoitement.user.name,
        date: format(
          parseISO(appoitement.date),
          "'dia' dd 'de' MMMM', às' H:mm'h' ",
          {
            locale: pt
          }
        )
      }
    });
  }
}

export default new CancellationMail();
