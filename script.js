const manualTab = document.getElementById("manualTab");
const mailTab = document.getElementById("mailTab");
const manualPanel = document.getElementById("manualPanel");
const mailPanel = document.getElementById("mailPanel");
const manualForm = document.getElementById("manualForm");
const mailForm = document.getElementById("mailForm");
const resultCard = document.getElementById("resultCard");
const resultName = document.getElementById("resultName");
const resultCompany = document.getElementById("resultCompany");
const charCount = document.getElementById("charCount");

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

manualTab.addEventListener("click", () => setTab("manual"));
mailTab.addEventListener("click", () => setTab("mail"));

manualForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const name = document.getElementById("speakerName").value.trim();
  const company = document.getElementById("companyName").value.trim();

  if (name) {
    resultName.textContent = name;
  }

  if (company) {
    resultCompany.textContent = company;
  }

  resultCard.classList.add("visible");
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
});

mailForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const text = document.getElementById("mailBody").value.trim();

  if (text.length > 0) {
    charCount.textContent = `文字数: ${text.length}字`;
  }

  resultCard.classList.add("visible");
  resultCard.scrollIntoView({ behavior: "smooth", block: "start" });
});
