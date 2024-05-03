import puppeteer from "puppeteer";
import chalk from "chalk";

interface IStudentData {
  stdData: string[][];
  resultData: string[][];
}

interface NetworkError {
  success: boolean;
  message: string;
}

export class Dom {
  async getDataFromWeb(url: string): Promise<IStudentData | NetworkError> {
    const browser = await puppeteer.launch({
      headless: "new",
    });

    const page = await browser.newPage();
    page.setDefaultTimeout(20000);
    await page.goto(url);

    // Wait for the table to be created by PHP
    try {
      await page.waitForSelector("table");
    } catch {
      return {
        success: false,
        message: "Network error",
      } as NetworkError;
    }

    // Extract the table data
    const stdData = await page.evaluate(() => {
      const table = document.querySelector("#student_info");
      if (!table) throw new Error("Table not found");
      const rows = table.querySelectorAll("tr");
      const data = [];
      for (const row of rows) {
        const cells = row.querySelectorAll(
          "td,th",
        ) as NodeListOf<HTMLTableCellElement>;
        data.push(Array.from(cells, (cell) => cell.innerText.trim()));
      }
      return data;
    });

    const resultData = await page.evaluate(() => {
      const table = document.querySelector("#results_subject_table");
      if (!table) throw new Error("Table not found");
      const rows = table.querySelectorAll("tr");
      const data = [];
      for (const row of rows) {
        const cells = row.querySelectorAll(
          "td,th",
        ) as NodeListOf<HTMLTableCellElement>;
        data.push(Array.from(cells, (cell) => cell.innerText.trim()));
      }
      return data;
    });

    await browser.close();
    return { stdData, resultData } as IStudentData;
  }

  async getStudentData(
    url: string,
    rollNo: string,
    sem: string,
  ): Promise<IStudentData | NetworkError> {
    const result = await this.getDataFromWeb(`${url}?r=${rollNo}&e=${sem}`);
    return result;
  }

  async getAllStudentsData(
    url: string,
    fristRollNo: string,
    lastRollNo: string,
    sem: string,
  ) {
    const stRollNo = parseInt(fristRollNo.substring(4));
    const endRollNo = parseInt(lastRollNo.substring(4));

    // setting title for columns
    let result: string[][] = [["Sl.No", "Student Roll No", "Student Name"]];
    let missedRollNo: string[] = [];

    // SL.NO
    let j = 1;

    for (let i = stRollNo; i <= endRollNo; i++) {
      const rollNo = `${fristRollNo.slice(0, 4)}${i
        .toString()
        .padStart(4, "0")}`;
      console.log(rollNo, stRollNo, endRollNo);

      console.log(chalk.blue(`Fetching data for ${rollNo}...`));

      let TotalGradePoint: number = 0;
      let TotalCredit: number = 0;

      const currentStdData: IStudentData | NetworkError =
        await this.getStudentData(url, rollNo, sem);

      if ("message" in currentStdData) {
        missedRollNo.push(rollNo);
        continue;
      }

      console.log(chalk.blue(currentStdData.stdData[1][0]), chalk.green("✓"));

      const { stdData, resultData } = currentStdData;
      const stdRollNo: string = stdData[1][0].split(":")[1].trim();
      const stdName: string = stdData[2][0].split(":")[1].trim();
      let currentResult = [j.toString(), stdRollNo, stdName];

      resultData.splice(1).forEach((element: string[]) => {
        if (j === 1) {
          TotalCredit += parseInt(element[3]);
          result[0].push(
            ...[`${element[1]}'s Grade Point`, `${element[1]}'s Grade`],
          );
        }
        currentResult.push(...[element[4], element[6]]);
        // TotalGradePoint =
        // TotalGradePoint + parseInt(element[4]) * parseInt(element[3]);
      });

      // if (j === 1) result[0].push("Total Grade Point");
      j++;

      // console.log(`Total Grade Point: `, chalk.yellow(TotalGradePoint));
      // currentResult.push((TotalGradePoint / TotalCredit).toString());
      result.push(currentResult);
    }

    console.log(chalk.red("Missed Roll No: "));
    console.log(chalk.red(missedRollNo.join(", ")));
    return result;
  }
}
