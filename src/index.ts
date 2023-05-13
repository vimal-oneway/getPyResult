import inquirer from "inquirer";
import xlsx from "xlsx";
import { Readable } from "stream";
import { Dom } from "./Dom.js";
import chalk from "chalk";

xlsx.stream.set_readable(Readable);

export const Semester = new Map<string, string>();
Semester.set("I", "A");
Semester.set("II", "B");
Semester.set("III", "C");
Semester.set("IV", "D");
Semester.set("V", "E");
Semester.set("VI", "F");

class Main {
  dom: Dom;
  constructor() {
    this.dom = new Dom();
  }

  writeDataToExcel(
    data: string[][],
    sheetName: string,
    outputFileName: string
  ) {
    let workbook;

    try {
      workbook = xlsx.readFile(outputFileName);
      if (workbook.SheetNames.includes(sheetName)) {
        console.log(workbook.SheetNames, sheetName, "sheet already exists");
      } else {
        console.log(chalk.blue("Creating new sheet"));
        workbook.SheetNames.push(sheetName);
      }
    } catch (error) {
      console.log(chalk.blue("Creating new file"));
      workbook = xlsx.utils.book_new();
      workbook.SheetNames.push(sheetName);
    }

    // Add the new worksheet to the workbook
    const prevWorkSheetData: any = xlsx.utils.sheet_to_json(
      workbook.Sheets[sheetName]
    );
    const worksheet = xlsx.utils.json_to_sheet([...prevWorkSheetData, ...data]);
    workbook.Sheets[sheetName] = worksheet;

    // Write the updated workbook back to the file
    xlsx.writeFile(workbook, outputFileName);
    console.log(chalk.green("Data written to excel file"));
  }

  async fetchTableAndWriteToExcel(
    sheetName: string,
    outputFileName: string,
    baseUrl: string,
    startRoll: string,
    endRoll: string,
    sem: string
  ) {
    console.log(chalk.green("Fetching data from web..."));

    const data = await this.dom.getAllStudentsData(
      baseUrl,
      startRoll,
      endRoll,
      sem
    );
    this.writeDataToExcel(data, sheetName, outputFileName);
  }

  async getAndSetInput() {
    let { sheetName, outputFileName, baseUrl, startRoll, endRoll, sem } =
      await inquirer.prompt([
        {
          name: "outputFileName",
          type: "string",
          message: "Enter Output File Name:",
        },
        {
          name: "sheetName",
          type: "string",
          message: "Enter sheet Name:",
        },
        {
          name: "baseUrl",
          type: "string",
          message: "Enter Base Url:",
          default: "http://exam.pondiuni.edu.in/results/result.php",
        },
        {
          name: "startRoll",
          type: "string",
          message: "Enter Starting Roll Number:",
        },
        {
          name: "endRoll",
          type: "string",
          message: "Enter Ending Roll Number:",
        },
        {
          name: "sem",
          type: "list",
          message: "Choose Semester:",
          choices: ["I", "II", "III", "IV", "V", "VI"],
        },
      ]);
    if (
      !sheetName ||
      !outputFileName ||
      !baseUrl ||
      !startRoll ||
      !endRoll ||
      !sem
    )
      throw new Error(`Kindly, Re-fill the form`);

    const semester = Semester.get(sem);
    if (!semester) throw new Error(`something went wrong, try again later`);

    if (outputFileName.split(".").pop() !== "xlsx") outputFileName += ".xlsx";

    this.fetchTableAndWriteToExcel(
      sheetName,
      outputFileName,
      baseUrl,
      startRoll,
      endRoll,
      semester
    );
  }
}

new Main().getAndSetInput();
