import { Response } from "express";
import { createLogger, format, transports } from "winston";

const printRed = (text: string) => {
  console.log("\x1b[31m%s\x1b[0", `${text} \n`);
};

const logger = createLogger({
  transports: [
    new transports.File({
      filename: "./logs/index.log",
      level: "error",
      format: format.combine(
        format.timestamp({ format: "YYY-MM-DD HH:mm:ss" }),
        format.printf(
          (info) => `${info.timestamp} ${info.level} : ${info.message}`
        )
      ),
    }),
  ],
});

const handleError = (
  res: Response,
  message: string,
  statusCode: number = 400
) => {
  logger.log({ level: "error", message });
  return res.status(statusCode).json({ status: false, message });
};
const handleSuccess = (
  res: Response,
  message: string,
  data: {},
  statusCode: number = 200
) => {
  return res
    .status(statusCode)
    .json({ status: true, message, data: { ...data } });
};

const generateCode = (num: number = 15) => {
  const dateString = Date.now().toString(36);
  const randomness = Math.random().toString(36).substr(2);
  let result = randomness + dateString;
  result = result.length > num ? result.substring(0, num) : result;
  return result.toUpperCase();
};

const isEmpty = (data: any) => {
  return (
    !data ||
    data.length === 0 ||
    typeof data == "undefined" ||
    data == null ||
    Object.keys(data).length == 0
  );
};

const escapesHtml = (html: string) => {
  return html.replace(/[&<>"']/g, "");
};

const parseToObject = (value: string): any => {
  let counter = 0;
  let data = JSON.parse(value);
  while (counter <= 2) {
    if (typeof data == "object") {
      break;
    } else {
      data = JSON.parse(data);
      counter++;
    }
  }
  return data;
};

const Utility = {
  isEmpty,
  printRed,
  handleError,
  handleSuccess,
  generateCode,
  escapesHtml,
  parseToObject,
};

export default Utility;
