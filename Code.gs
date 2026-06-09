function doGet() {
  return HtmlService.createHtmlOutputFromFile('index')
    .setTitle('XXX學校跑班課 QRCode簽到點名系統');
}

/* ========= 使用者驗證 ========= */

function getUserInfo() {

  const email = Session.getActiveUser().getEmail();

  const sh = SpreadsheetApp
    .getActive()
    .getSheetByName("User");

  const data = sh.getDataRange().getValues();

  for (let i = 1; i < data.length; i++) {

    if (
      String(data[i][2]).toLowerCase() ==
      email.toLowerCase()
    ) {

      return {
        success: true,
        email: email,
        name: data[i][0],
        title: data[i][1]
      };
    }
  }

  return {
    success: false,
    email: email
  };
}

function checkPermission() {

  const user = getUserInfo();

  if (!user.success) {
    throw new Error("您沒有使用權限");
  }

  return user;
}

/* ========= 教師課程 ========= */

function getTeacherCourses() {

  const teacher = checkPermission();

  const sh = SpreadsheetApp
    .getActive()
    .getSheetByName("課程資料");

  const data = sh.getDataRange().getValues();

  const courses = [];

  for (let i = 1; i < data.length; i++) {

    if (data[i][8] == teacher.name) {

      const courseText =
        data[i][5] + "（" + data[i][6] + "）";

      if (!courses.includes(courseText)) {
        courses.push(courseText);
      }
    }
  }

  return courses.sort();
}

/* ========= 課程學生 ========= */

function getCourseStudents(courseText) {

  const teacher = checkPermission();

  const sh = SpreadsheetApp
    .getActive()
    .getSheetByName("課程資料");

  const data = sh.getDataRange().getValues();

  const result = [];

  for (let i = 1; i < data.length; i++) {

    const currentCourse =
      data[i][5] + "（" + data[i][6] + "）";

    if (
      data[i][8] == teacher.name &&
      currentCourse == courseText
    ) {

      result.push({
        className: data[i][1],
        seat: data[i][2],
        studentId: data[i][3],
        name: data[i][4],
        courseName: data[i][5],
        subject: data[i][6],
        classroom: data[i][7]
      });
    }
  }

  return result;
}

/* ========= 節次 ========= */

function getCurrentPeriod() {

  const now = new Date();

  const hhmm = Utilities.formatDate(
    now,
    Session.getScriptTimeZone(),
    "HH:mm"
  );

  const periods = [
    ["08:10", "09:00", 1],
    ["09:10", "10:00", 2],
    ["10:10", "11:00", 3],
    ["11:10", "12:00", 4],
    ["13:10", "14:00", 5],
    ["14:10", "15:00", 6],
    ["15:10", "16:00", 7],
    ["16:10", "17:00", 8],
    ["17:10", "18:00", 9]
  ];

  for (let p of periods) {

    if (hhmm >= p[0] && hhmm <= p[1]) {
      return p[2];
    }
  }

  return 0;
}

/* ========= 寄送單封郵件 ========= */

function sendOneMail(student, testMode) {

  const teacher = checkPermission();

  const period = getCurrentPeriod();

  const today = Utilities.formatDate(
    new Date(),
    Session.getScriptTimeZone(),
    "yyyyMMdd"
  );

  const qrText =
    student.studentId + "|" +
    student.name + "|" +
    today + "|" +
    period + "|" +
    student.subject;

  const qrUrl =
    "https://chart.googleapis.com/chart" +
    "?cht=qr" +
    "&chs=380x380" +
    "&chl=" +
    encodeURIComponent(qrText);

  const qrBlob = UrlFetchApp
    .fetch(qrUrl)
    .getBlob()
    .setName(student.studentId + "_QR.png");

  const targetMail =
    testMode
      ? teacher.email
      : "stu" +
        student.studentId +
        "@kssh.khc.edu.tw";

  const html = `
  <div style="font-family:Microsoft JhengHei">

    <h2>課程簽到通知</h2>

    <table border="1"
            cellpadding="6"
            style="border-collapse:collapse">

      <tr>
        <td>姓名</td>
        <td>${student.name}</td>
      </tr>

      <tr>
        <td>課程名稱</td>
        <td>${student.courseName}</td>
      </tr>

      <tr>
        <td>科目</td>
        <td>${student.subject}</td>
      </tr>

      <tr>
        <td>教室</td>
        <td>${student.classroom}</td>
      </tr>

      <tr>
        <td>節次</td>
        <td>${period}</td>
      </tr>

    </table>

    <br>

    請使用附件 QR Code 完成簽到。

  </div>
  `;

  GmailApp.sendEmail(
    targetMail,
    "跑班課簽到通知",
    "請查看附件 QR Code",
    {
      htmlBody: html,
      attachments: [qrBlob]
    }
  );

  return true;
}
