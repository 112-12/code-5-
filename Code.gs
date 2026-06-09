function sendMail(student, testMode) {

  // 驗證老師權限
  const email = Session.getActiveUser().getEmail();

  // 學生信箱
  const targetMail = testMode
    ? email
    : `stu${student.studentId}@kssh.khc.edu.tw`;

  // QR內容
  const qrText =
    `${student.studentId}|${student.name}|` +
    `${Utilities.formatDate(new Date(), Session.getScriptTimeZone(), "yyyyMMdd")}|` +
    `${getPeriod()}|${student.subject}`;

  // QR圖片
  const qrBlob = UrlFetchApp.fetch(
    `https://chart.googleapis.com/chart?cht=qr&chs=350x350&chl=${encodeURIComponent(qrText)}`
  ).getBlob()
   .setName(`${student.studentId}_QR.png`);

  // 信件
  GmailApp.sendEmail(
    targetMail,
    "跑班課簽到通知",
    "請查看附件 QR Code",
    {
      htmlBody: `
      <h3>課程簽到通知</h3>
      <table border="1" cellpadding="5">
        <tr><td>課程名稱</td><td>${student.courseName}</td></tr>
        <tr><td>科目</td><td>${student.subject}</td></tr>
        <tr><td>教室</td><td>${student.classroom}</td></tr>
        <tr><td>節次</td><td>${getPeriod()}</td></tr>
      </table>
      `,
      attachments:[qrBlob]
    }
  );

  return true;
}

function getPeriod() {

  const h = new Date().getHours();

  if(h < 9) return 1;
  if(h < 10) return 2;
  if(h < 11) return 3;
  if(h < 12) return 4;
  if(h < 14) return 5;
  if(h < 15) return 6;
  if(h < 16) return 7;
  if(h < 17) return 8;

  return 9;
}
