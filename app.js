const TOTAL_QUESTIONS = 12;
const RADIO_GROUPS = ["age", "gender", "region", "kimchiKnown", "kimchiTaste", "kimchiFrequency", "kimchiBuy", "kimchiWhere", "kimchiFactor", "kimchiType", "kimchiBarrier", "kimchiRecommend"];

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxtxK-MAvafa0jWXjX90M9ElP0VIc5QviW9XXSvzjFvQH6y6ql9sfJEXOhYHpJSh5HlcQ/exec";

const steps = [[1], [2, 3], [4], [5], [6], [7], [8], [9], [10], [11], [12]];
let stepIndex = 0;
let moving = false;

function startSurvey() {
    document.getElementById("introScreen").classList.add("hidden");
    document.getElementById("surveyScreen").classList.remove("hidden");
    document.getElementById("progressArea").classList.remove("hidden");
    stepIndex = 0;
    showStep();
}

function showStep() {
    const current = new Set(steps[stepIndex]);
    document.querySelectorAll(".question-card").forEach((card) => {
        card.classList.toggle("active", current.has(Number(card.dataset.question)));
    });

    const first = steps[stepIndex][0];
    const last = steps[stepIndex][steps[stepIndex].length - 1];
    const label = first === last
        ? `Pergunta ${first} de ${TOTAL_QUESTIONS}`
        : `Perguntas ${first}–${last} de ${TOTAL_QUESTIONS}`;
    const percent = Math.round((stepIndex / steps.length) * 100);

    document.getElementById("progressText").textContent = label;
    document.getElementById("progressPercent").textContent = `${percent}%`;
    document.getElementById("progressFill").style.width = `${percent}%`;
    document.getElementById("backButton").classList.toggle("hidden", stepIndex === 0);
    const whereOther = document.querySelector('input[name="kimchiWhere"]:checked');
    const needsNext = current.has(8) && whereOther && whereOther.value === "Outro";
    document.getElementById("nextButton").classList.toggle("hidden", !needsNext);
    document.getElementById("submitButton").classList.toggle("hidden", !current.has(12));
    const otherField = document.getElementById("kimchiWhereOther");
    if (!current.has(8) || !whereOther || whereOther.value !== "Outro") otherField.classList.remove("show");
    window.scrollTo(0, 0);
}

function stepAnswered() {
    return steps[stepIndex].every((number) => {
        const picked = document.querySelector(`[data-question="${number}"] input:checked`);
        if (!picked) return false;
        if (picked.name === "kimchiWhere" && picked.value === "Outro") {
            return document.getElementById("kimchiWhereOther").value.trim().length > 0;
        }
        return true;
    });
}

function goNext() {
    if (moving || stepIndex >= steps.length - 1) return;
    if (!stepAnswered()) {
        showError("Escolha uma opção para continuar.");
        return;
    }
    moving = true;
    stepIndex += 1;
    showStep();
    setTimeout(() => { moving = false; }, 280);
}

document.getElementById("backButton").addEventListener("click", () => {
    if (stepIndex === 0) return;
    stepIndex -= 1;
    showStep();
});

document.getElementById("nextButton").addEventListener("click", goNext);

document.getElementById("kimchiWhereOther").addEventListener("input", () => {
    if (steps[stepIndex].includes(8) && stepAnswered()) {
        document.getElementById("nextButton").classList.remove("hidden");
    }
});

document.addEventListener("change", function (event) {
    const input = event.target;
    if (!input.matches('input[type="radio"]')) return;

    const otherField = document.getElementById("kimchiWhereOther");
    if (input.name === "kimchiWhere") {
        const isOther = input.value === "Outro";
        otherField.classList.toggle("show", isOther);
        document.getElementById("nextButton").classList.toggle("hidden", !isOther);
        if (isOther) return;
    }

    if (steps[stepIndex].includes(12)) return;
    if (stepAnswered()) setTimeout(goNext, 180);
});

function validateSurvey() {
    for (const group of RADIO_GROUPS) {
        const selected = document.querySelector(`input[name="${group}"]:checked`);
        if (!selected) {
            showError("Por favor, responda todas as perguntas antes de enviar.");
            document.querySelector(`input[name="${group}"]`)
                ?.closest(".question-card")
                ?.scrollIntoView({ behavior: "smooth", block: "center" });
            return false;
        }
    }

    const where = document.querySelector('input[name="kimchiWhere"]:checked');
    if (where && where.value === "Outro" && !document.getElementById("kimchiWhereOther").value.trim()) {
        showError("Escreva a outra resposta antes de enviar.");
        stepIndex = steps.findIndex((step) => step.includes(8));
        showStep();
        return false;
    }

    return true;
}

function collectSurveyData() {
    const getRadio = (name) => {
        const element = document.querySelector(`input[name="${name}"]:checked`);
        return element ? element.value : "";
    };

    return {
        timestamp: new Date().toISOString(),
        age: getRadio("age"),
        gender: getRadio("gender"),
        region: getRadio("region"),
        kimchiKnown: getRadio("kimchiKnown"),
        kimchiTaste: getRadio("kimchiTaste"),
        kimchiFrequency: getRadio("kimchiFrequency"),
        kimchiBuy: getRadio("kimchiBuy"),
        kimchiWhere: getRadio("kimchiWhere"),
        kimchiWhereOther: document.getElementById("kimchiWhereOther").value.trim(),
        kimchiFactor: getRadio("kimchiFactor"),
        kimchiType: getRadio("kimchiType"),
        kimchiBarrier: getRadio("kimchiBarrier"),
        kimchiRecommend: getRadio("kimchiRecommend")
    };
}

async function submitSurvey() {
    if (!validateSurvey()) return;

    const button = document.getElementById("submitButton");
    button.disabled = true;
    button.textContent = "Enviando...";

    const data = collectSurveyData();

    try {
        if (GOOGLE_SCRIPT_URL.includes("COLOQUE_AQUI")) {
            saveLocal(data);
        } else {
            await postToSheet(data);
            saveLocal(data);
        }
        showSuccess();
    } catch (error) {
        console.error(error);
        saveLocal(data);
        showSuccess();
    }
}

function postToSheet(data) {
    return new Promise((resolve) => {
        const iframe = document.createElement("iframe");
        iframe.name = "kfood-sheet";
        iframe.hidden = true;
        const form = document.createElement("form");
        form.method = "POST";
        form.action = GOOGLE_SCRIPT_URL;
        form.target = iframe.name;
        Object.entries(data).forEach(([key, value]) => {
            const input = document.createElement("input");
            input.type = "hidden";
            input.name = key;
            input.value = String(value);
            form.appendChild(input);
        });
        document.body.appendChild(iframe);
        document.body.appendChild(form);
        form.submit();
        setTimeout(() => {
            form.remove();
            iframe.remove();
            resolve();
        }, 2500);
    });
}

function saveLocal(data) {
    const existing = JSON.parse(localStorage.getItem("kfoodSurveyData") || "[]");
    existing.push(data);
    localStorage.setItem("kfoodSurveyData", JSON.stringify(existing));
}

function showSuccess() {
    document.getElementById("surveyScreen").classList.add("hidden");
    document.getElementById("successScreen").classList.remove("hidden");
    document.getElementById("progressArea").classList.remove("hidden");
    document.getElementById("progressFill").style.width = "100%";
    document.getElementById("progressText").textContent = "Pesquisa concluída";
    document.getElementById("progressPercent").textContent = "100%";
}

function goToRoulette() {
    sessionStorage.setItem("kfoodSurveyDone", "1");
    window.location.href = "roulette.html";
}

function showError(message) {
    const error = document.getElementById("errorMessage");
    error.textContent = message;
    error.classList.remove("hidden");
    setTimeout(() => error.classList.add("hidden"), 3500);
}
