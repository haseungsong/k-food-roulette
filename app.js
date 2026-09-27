const TOTAL_QUESTIONS = 9;
const RADIO_GROUPS = ["age", "gender", "region", "awareness", "favorite", "frequency", "purchase", "interest"];

const GOOGLE_SCRIPT_URL = "COLOQUE_AQUI_SUA_URL_DO_GOOGLE_APPS_SCRIPT";

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
            await fetch(GOOGLE_SCRIPT_URL, {
                method: "POST",
                mode: "no-cors",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(data)
            });
            saveLocal(data);
        }
        showSuccess();
    } catch (error) {
        console.error(error);
        saveLocal(data);
        showSuccess();
    }
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
