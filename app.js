const TOTAL_QUESTIONS = 9;
const RADIO_GROUPS = ["age", "gender", "region", "awareness", "favorite", "frequency", "purchase", "interest"];

const GOOGLE_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbxtxK-MAvafa0jWXjX90M9ElP0VIc5QviW9XXSvzjFvQH6y6ql9sfJEXOhYHpJSh5HlcQ/exec";

function startSurvey() {
    document.getElementById("introScreen").classList.add("hidden");
    document.getElementById("surveyScreen").classList.remove("hidden");
    document.getElementById("progressArea").classList.remove("hidden");
    updateProgress();
}

function countAnswered() {
    let count = 0;
    for (const name of RADIO_GROUPS) {
        if (document.querySelector(`input[name="${name}"]:checked`)) count++;
    }
    if (document.querySelector('input[name="foods"]:checked')) count++;
    return count;
}

function updateProgress() {
    const done = countAnswered();
    const current = Math.min(TOTAL_QUESTIONS, done + 1);
    const percent = Math.round((done / TOTAL_QUESTIONS) * 100);

    document.getElementById("progressText").textContent =
        `Pergunta ${current} de ${TOTAL_QUESTIONS}`;
    document.getElementById("progressPercent").textContent = `${percent}%`;
    document.getElementById("progressFill").style.width = `${percent}%`;
}

document.addEventListener("change", function (event) {
    if (event.target.matches('input[type="radio"], input[type="checkbox"]')) {
        updateProgress();
    }
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

    const foods = document.querySelectorAll('input[name="foods"]:checked');
    if (foods.length === 0) {
        showError("Por favor, selecione pelo menos uma opção na pergunta 5.");
        document.querySelector('[data-question="5"]')
            .scrollIntoView({ behavior: "smooth", block: "center" });
        return false;
    }

    return true;
}

function collectSurveyData() {
    const getRadio = (name) => {
        const element = document.querySelector(`input[name="${name}"]:checked`);
        return element ? element.value : "";
    };

    const foods = Array.from(document.querySelectorAll('input[name="foods"]:checked'))
        .map((element) => element.value);

    return {
        timestamp: new Date().toISOString(),
        age: getRadio("age"),
        gender: getRadio("gender"),
        region: getRadio("region"),
        awareness: getRadio("awareness"),
        foods: foods.join(", "),
        favorite: getRadio("favorite"),
        frequency: getRadio("frequency"),
        purchase: getRadio("purchase"),
        interest: Number(getRadio("interest"))
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
