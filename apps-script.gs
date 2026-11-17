function doGet() {
  return ContentService.createTextOutput("ok");
}

function doPost(e) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sheet = ss.getSheetByName("Survey2");
  if (!sheet) sheet = ss.insertSheet("Survey2");

  const data = (e && e.parameter) || {};
  const headers = [
    "timestamp",
    "idade",
    "genero",
    "regiao",
    "Você já conhecia o Kimchi antes deste festival?",
    "O que você achou do sabor do Kimchi?",
    "Com que frequência você consome Kimchi?",
    "Você compraria Kimchi em supermercados brasileiros?",
    "Onde você gostaria de encontrar Kimchi à venda?",
    "Outra resposta",
    "Qual seria o principal fator na sua decisão de comprar Kimchi?",
    "Qual tipo de Kimchi você teria mais interesse em comprar?",
    "O que mais dificulta o consumo de Kimchi no Brasil?",
    "Você recomendaria Kimchi para amigos ou familiares?"
  ];

  if (sheet.getLastRow() === 0) sheet.appendRow(headers);

  sheet.appendRow([
    data.timestamp || new Date(),
    data.age || "",
    data.gender || "",
    data.region || "",
    data.kimchiKnown || "",
    data.kimchiTaste || "",
    data.kimchiFrequency || "",
    data.kimchiBuy || "",
    data.kimchiWhere || "",
    data.kimchiWhereOther || "",
    data.kimchiFactor || "",
    data.kimchiType || "",
    data.kimchiBarrier || "",
    data.kimchiRecommend || ""
  ]);

  return ContentService.createTextOutput("ok");
}
