const manualTab = document.getElementById("manualTab");
const mailTab = document.getElementById("mailTab");
const manualPanel = document.getElementById("manualPanel");
const mailPanel = document.getElementById("mailPanel");
const manualForm = document.getElementById("manualForm");
const mailForm = document.getElementById("mailForm");

const resultCard = document.getElementById("resultCard");
const resultName = document.getElementById("resultName");
const resultCompany = document.getElementById("resultCompany");
const resultStatus = document.getElementById("resultStatus");
const summary = document.getElementById("summary");
const linksGrid = document.getElementById("linksGrid");
const charCount = document.getElementById("charCount");

const manualSubmit = document.getElementById("manualSubmit");
const mailSubmit = document.getElementById("mailSubmit");

function setTab(mode) {
  const isManual = mode === "manual";

  manualTab.classList.toggle("active", isManual);
  mailTab.classList.toggle("active", !isManual);
  manualTab.setAttribute("aria-selected", String(isManual));
  mailTab.setAttribute("aria-selected", String(!isManual));

  manualPanel.classList.toggle("active", isManual);
  mailPanel.classList.toggle("active", !isManual);
  mailPanel.setAttribute("aria-hidden", String(isManual));
}

function setLoading(isLoading) {
  manualSubmit.disabled = isLoading;
  mailSubmit.disabled = isLoading;
  resultStatus.textContent = isLoading ? "検索中..." : "リサーチ完了";
  resultStatus.classList.toggle("searching", isLoading);
}

function parseMailForProfile(mailText) {
  const compact = mailText.replace(/\r/g, "");
  const patterns = [
    { name: /(?:氏名|登壇者|Speaker)\s*[:：]\s*([^\n]+)/i, company: /(?:所属|会社|企業名)\s*[:：]\s*([^\n]+)/i },
    { name: /([一-龥ぁ-んァ-ヶA-Za-z\s]{2,40})\s*(?:様|さん)?\s*(?:が|の登壇|が登壇)/, company: /(?:株式会社[^\s\n、。]{1,40}|[A-Za-z][A-Za-z0-9&\-\s]{2,40}(?:Inc\.|Ltd\.|Corp\.)?)/ },
  ];

  for (const p of patterns) {
    const name = compact.match(p.name)?.[1]?.trim();
    const company = compact.match(p.company)?.[1]?.trim();
    if (name && company) {
      return { name, company };
    }
  }

  return null;
}

async function searchWikipedia(query) {
  const searchUrl = `https://ja.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&utf8=&format=json&origin=*`;
  const searchRes = await fetch(searchUrl);

  if (!searchRes.ok) {
    throw new Error("Wikipedia検索に失敗しました");
  }

  const searchData = await searchRes.json();
  const first = searchData?.query?.search?.[0];

  if (!first) {
    return null;
  }

  const pageId = first.pageid;
  const detailUrl = `https://ja.wikipedia.org/w/api.php?action=query&pageids=${pageId}&prop=extracts|info&inprop=url&exintro=1&explaintext=1&format=json&origin=*`;
  const detailRes = await fetch(detailUrl);

  if (!detailRes.ok) {
    throw new Error("Wikipedia詳細取得に失敗しました");
  }

  const detailData = await detailRes.json();
  const page = detailData?.query?.pages?.[pageId];

  if (!page) {
    return null;
  }

  return {
    title: page.title,
    summary: page.extract || "要約を取得できませんでした。",
    url: page.fullurl || `https://ja.wikipedia.org/wiki/${encodeURIComponent(page.title)}`,
  };
}

function buildSummary(name, company, personInfo, companyInfo) {
  const chunks = [`${name}（${company}）についてWeb検索した結果です。`];

  if (personInfo) {
    chunks.push(`【人物情報: ${personInfo.title}】${personInfo.summary}`);
  }

  if (companyInfo) {
    chunks.push(`【企業情報: ${companyInfo.title}】${companyInfo.summary}`);
  }

  if (!personInfo && !companyInfo) {
    chunks.push("一致する公開情報を見つけられませんでした。入力キーワードを変えて再度お試しください。");
  }

  return chunks.join("\n\n");
}

function updateLinks(personInfo, companyInfo, fallbackQueries = []) {
  linksGrid.innerHTML = "";

  const sources = [personInfo, companyInfo].filter(Boolean);

  for (const source of sources) {
    const link = document.createElement("a");
    link.href = source.url;
    link.target = "_blank";
    link.rel = "noopener noreferrer";
    link.textContent = source.title;
    linksGrid.appendChild(link);
  }

  if (linksGrid.childElementCount === 0) {
    for (const query of fallbackQueries.slice(0, 2)) {
      const fallback = document.createElement("a");
      fallback.href = `https://www.google.com/search?q=${encodeURIComponent(query)}`;
      fallback.target = "_blank";
      fallback.rel = "noopener noreferrer";
      fallback.textContent = `Google検索: ${query}`;
      linksGrid.appendChild(fallback);
    }
  }
}

async function runResearch(name, company) {
  resultCard.classList.add("visible");
  resultName.textContent = name;
  resultCompany.textContent = company;
  resultCompany.href = `https://www.google.com/search?q=${encodeURIComponent(company)}`;
  summary.textContent = "Web検索中です...";
  charCount.textContent = "文字数: 0字";
  linksGrid.innerHTML = "";

  setLoading(true);

  try {
    const [personInfo, companyInfo] = await Promise.all([
      searchWikipedia(`${name} ${company}`),
      searchWikipedia(company),
    ]);

    const text = buildSummary(name, company, personInfo, companyInfo);
    summary.textContent = text;
    charCount.textContent = `文字数: ${text.length}字`;
    updateLinks(personInfo, companyInfo, [`${name} ${company}`, company]);
  } catch (error) {
    summary.textContent = "検索中にエラーが発生しました。しばらくして再度お試しください。";
    updateLinks(null, null, [`${name} ${company}`, company]);
    console.error(error);
  } finally {
    setLoading(false);
    resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

manualTab.addEventListener("click", () => setTab("manual"));
mailTab.addEventListener("click", () => setTab("mail"));

manualForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const name = document.getElementById("speakerName").value.trim();
  const company = document.getElementById("companyName").value.trim();

  if (!name || !company) {
    return;
  }

  await runResearch(name, company);
});

mailForm.addEventListener("submit", async (event) => {
  event.preventDefault();
  const text = document.getElementById("mailBody").value.trim();
  const profile = parseMailForProfile(text);

  if (!profile) {
    resultCard.classList.add("visible");
    resultStatus.textContent = "入力不足";
    resultStatus.classList.remove("searching");
    summary.textContent = "メール本文から氏名と所属企業を抽出できませんでした。「氏名:」「所属:」形式で入力してください。";
    linksGrid.innerHTML = "";
    charCount.textContent = `文字数: ${text.length}字`;
    return;
  }

  await runResearch(profile.name, profile.company);
});
